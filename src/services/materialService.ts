import type {
  LearningMaterial,
  MaterialFileType,
  MaterialStatus,
  ApiResult,
} from '../types';
import { getCurrentUser, type UserProfile } from './auth';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';
import { getClassrooms } from './classService';

export const MATERIALS_KEY = 'd2p_materials_v1';
export const BLOBS_KEY = 'd2p_file_blobs_v1';

// Giới hạn dung lượng tải lên: tối đa 25 MB
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

// Danh sách đuôi file được phép upload
export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.pptx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
];

// Danh sách định dạng nguy hại cấm tuyệt đối
export const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.js',
  '.vbs',
  '.msi',
  '.html',
  '.htm',
  '.dll',
  '.com',
  '.scr',
  '.pif',
  '.jar',
];

export interface MaterialFilter {
  subjectId?: string;
  classId?: string;
  fileType?: MaterialFileType | 'all';
  status?: MaterialStatus | 'all';
  search?: string;
  schoolId?: string;
}

export interface UploadMaterialParams {
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  contentType?: string;
  fileData?: string; // base64 / blob content
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  status?: MaterialStatus;
  sharedClassIds?: string[];
  schoolId?: string;
}

export interface UpdateMaterialParams {
  title?: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  status?: MaterialStatus;
  sharedClassIds?: string[];
}

/**
 * Định dạng dung lượng tệp đọc được cho người dùng
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Xác định phân loại file dựa trên phần mở rộng
 */
export const detectFileType = (fileName: string): MaterialFileType => {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx' || ext === '.doc') return 'docx';
  if (ext === '.pptx' || ext === '.ppt') return 'pptx';
  if (ext === '.txt') return 'txt';
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'image';
  return 'pdf';
};

/**
 * Kiểm tra tính an toàn của tệp tải lên
 */
export const validateFileUpload = (
  fileName: string,
  fileSize: number
): { valid: boolean; error?: string } => {
  if (!fileName || !fileName.includes('.')) {
    return { valid: false, error: 'Tệp không hợp lệ hoặc thiếu phần mở rộng (.extension).' };
  }

  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

  // 1. Chặn file thực thi độc hại
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Định dạng tệp "${ext}" tiềm ẩn rủi ro bảo mật và bị cấm tải lên hệ thống.`,
    };
  }

  // 2. Kiểm tra danh mục cho phép
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Hệ thống chỉ hỗ trợ các định dạng: ${ALLOWED_EXTENSIONS.join(', ')}.`,
    };
  }

  // 3. Kiểm tra dung lượng tệp
  if (fileSize <= 0) {
    return { valid: false, error: 'Tệp rỗng hoặc không có dữ liệu dung lượng.' };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Dung lượng tệp (${formatFileSize(fileSize)}) vượt quá giới hạn cho phép (25 MB).`,
    };
  }

  return { valid: true };
};

/**
 * Đọc danh sách tài liệu từ Storage
 */
export const getAllMaterialsRaw = (): LearningMaterial[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MATERIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Lưu danh sách tài liệu
 */
const saveMaterialsRaw = (list: LearningMaterial[]): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(list));
  }
};

/**
 * Đọc dữ liệu Blob từ kho lưu trữ riêng biệt
 */
export const getBlobContent = (storageKey: string): string | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BLOBS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map[storageKey] || null;
  } catch {
    return null;
  }
};

/**
 * Lưu Blob vào kho lưu trữ an toàn riêng biệt (tách biệt metadata)
 */
const saveBlobContent = (storageKey: string, content: string): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(BLOBS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[storageKey] = content;
    localStorage.setItem(BLOBS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

/**
 * Khởi tạo dữ liệu mẫu cho Module Tài liệu học tập
 */
export const initMaterialStorage = (): void => {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(MATERIALS_KEY)) {
    const seedMaterials: LearningMaterial[] = [
      {
        id: 'mat-001',
        title: 'Chuyên đề 01: Hàm số & Khảo sát sự biến thiên của hàm số',
        description: 'Tài liệu lý thuyết trọng tâm và bài tập phân dạng ôn thi THPT Quốc gia môn Toán.',
        originalFileName: 'Chuyen_de_Ham_So_12A1.pdf',
        storageKey: 'blob_mat_001_c9a18d2f',
        contentType: 'application/pdf',
        fileSize: 4 * 1024 * 1024 + 200 * 1024,
        fileSizeFormatted: '4.2 MB',
        fileType: 'pdf',
        uploadedBy: 'usr-teacher-01',
        uploadedByName: 'ThS. Trần Thị Giáo Viên',
        schoolId: 'school-lhp',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        topic: 'Giải tích - Chương 1',
        status: 'published',
        sharedClassIds: ['class-web-01'], // Lớp do usr-teacher-01 phụ trách
        downloadCount: 38,
        createdAt: '2026-09-10T08:30:00Z',
        updatedAt: '2026-09-10T08:30:00Z',
      },
      {
        id: 'mat-002',
        title: 'Bài tập Tích phân và Ứng dụng thực tế',
        description: 'Bộ sưu tập 50 câu hỏi trắc nghiệm và tự luận có hướng dẫn giải chi tiết.',
        originalFileName: 'Bai_tap_Tich_phan_Ung_dung.docx',
        storageKey: 'blob_mat_002_74e2b10a',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 2 * 1024 * 1024 + 150 * 1024,
        fileSizeFormatted: '2.1 MB',
        fileType: 'docx',
        uploadedBy: 'usr-teacher-01',
        uploadedByName: 'ThS. Trần Thị Giáo Viên',
        schoolId: 'school-lhp',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        topic: 'Nguyên hàm - Tích phân',
        status: 'published',
        sharedClassIds: ['class-web-01'],
        downloadCount: 29,
        createdAt: '2026-09-18T14:15:00Z',
        updatedAt: '2026-09-18T14:15:00Z',
      },
      {
        id: 'mat-003',
        title: 'Đề cương Ôn tập Giữa kỳ 1 - Môn Toán 12 (Bản dự thảo)',
        description: 'Tài liệu dự thảo lưu trữ nội bộ của giáo viên, chưa công bố cho học sinh.',
        originalFileName: 'De_cuong_Giua_Ky_Draft.pdf',
        storageKey: 'blob_mat_003_f3e490b8',
        contentType: 'application/pdf',
        fileSize: 1 * 1024 * 1024 + 800 * 1024,
        fileSizeFormatted: '1.8 MB',
        fileType: 'pdf',
        uploadedBy: 'usr-teacher-01',
        uploadedByName: 'ThS. Trần Thị Giáo Viên',
        schoolId: 'school-lhp',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        topic: 'Ôn tập học kỳ',
        status: 'draft',
        sharedClassIds: ['class-web-01'],
        downloadCount: 0,
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-01T09:00:00Z',
      },
      {
        id: 'mat-004',
        title: 'Cơ học chất điểm & Các định luật Newton chuyên sâu',
        description: 'Slide bài giảng Vật lý lớp 10 chất lượng cao của trường THPT Kim Liên.',
        originalFileName: 'Vat_Ly_10_Co_Hoc_KimLien.pptx',
        storageKey: 'blob_mat_004_11cb7a94',
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        fileSize: 5 * 1024 * 1024,
        fileSizeFormatted: '5.0 MB',
        fileType: 'pptx',
        uploadedBy: 'usr-teacher-kl',
        uploadedByName: 'Thầy Nguyễn Kim Liên',
        schoolId: 'school-kl',
        subjectId: 'sub-ly-10',
        subjectName: 'Vật lý 10',
        topic: 'Động lực học chất điểm',
        status: 'published',
        sharedClassIds: ['cls-kl-10a1'],
        downloadCount: 15,
        createdAt: '2026-09-12T10:00:00Z',
        updatedAt: '2026-09-12T10:00:00Z',
      },
    ];
    saveMaterialsRaw(seedMaterials);

    // Seed mock blob contents for download testing
    saveBlobContent('blob_mat_001_c9a18d2f', 'SAMPLE_BLOB_CONTENT_HAM_SO_PDF');
    saveBlobContent('blob_mat_002_74e2b10a', 'SAMPLE_BLOB_CONTENT_TICH_PHAN_DOCX');
    saveBlobContent('blob_mat_003_f3e490b8', 'SAMPLE_BLOB_CONTENT_DRAFT_PDF');
    saveBlobContent('blob_mat_004_11cb7a94', 'SAMPLE_BLOB_CONTENT_VAT_LY_PPTX');
  }
};

/**
 * Lấy danh sách tài liệu theo bộ lọc và quyền hạn người dùng
 */
export const getMaterials = (
  filter?: MaterialFilter,
  userOverride?: UserProfile
): ApiResult<LearningMaterial[]> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để truy cập tài liệu học tập.' },
    };
  }

  const allClasses = getClassrooms();
  let list = getAllMaterialsRaw();

  // 1. Phân quyền truy cập theo vai trò (ABAC Multi-Tenancy & School Scoping)
  if (user.role === 'student') {
    // Học sinh chỉ thấy tài liệu của các lớp mình đã tham gia
    const enrolledClasses = allClasses.filter((c) => c.studentIds?.includes(user.id));
    const enrolledClassIds = enrolledClasses.map((c) => c.id);

    list = list.filter((m) => {
      // Bắt buộc cùng trường học (nếu tài liệu có gắn schoolId)
      if (user.schoolId && m.schoolId && m.schoolId !== user.schoolId) {
        return false;
      }
      // Chỉ xem được tài liệu đã công bố (published)
      if (m.status !== 'published') {
        return false;
      }
      // Bắt buộc tài liệu phải được chia sẻ cho ít nhất 1 lớp học sinh đang học
      return m.sharedClassIds && m.sharedClassIds.some((cid) => enrolledClassIds.includes(cid));
    });
  } else if (user.role === 'teacher') {
    // Giáo viên chỉ thấy tài liệu thuộc trường mình
    if (user.schoolId) {
      list = list.filter((m) => m.schoolId === user.schoolId);
    }
  } else if (user.role === 'school_admin') {
    // School Admin quản lý tài liệu thuộc trường mình
    if (user.schoolId) {
      list = list.filter((m) => m.schoolId === user.schoolId);
    }
  }
  // System Admin xem được tất cả các trường

  // 2. Lọc theo các tiêu chí tìm kiếm
  if (filter?.schoolId) {
    list = list.filter((m) => m.schoolId === filter.schoolId);
  }

  if (filter?.subjectId && filter.subjectId !== 'all') {
    list = list.filter((m) => m.subjectId === filter.subjectId);
  }

  if (filter?.classId && filter.classId !== 'all') {
    list = list.filter((m) => m.sharedClassIds && m.sharedClassIds.includes(filter.classId!));
  }

  if (filter?.fileType && filter.fileType !== 'all') {
    list = list.filter((m) => m.fileType === filter.fileType);
  }

  if (filter?.status && filter.status !== 'all') {
    list = list.filter((m) => m.status === filter.status);
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.originalFileName.toLowerCase().includes(q) ||
        (m.topic && m.topic.toLowerCase().includes(q))
    );
  }

  // Sắp xếp mới nhất lên đầu
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { success: true, data: list };
};

/**
 * Lấy chi tiết tài liệu học tập có kiểm tra thẩm quyền
 */
export const getMaterialById = (
  id: string,
  userOverride?: UserProfile
): ApiResult<LearningMaterial> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const materials = getAllMaterialsRaw();
  const material = materials.find((m) => m.id === id);

  if (!material) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại hoặc đã bị xóa.' },
    };
  }

  // Lấy danh sách lớp học sinh tham gia nếu là học sinh
  let enrolledClassIds: string[] = [];
  if (user.role === 'student') {
    const allClasses = getClassrooms();
    enrolledClassIds = allClasses
      .filter((c) => c.studentIds?.includes(user.id))
      .map((c) => c.id);
  }

  // Thẩm định RBAC + ABAC
  const decision = checkPermission(user, 'material:read', {
    resourceSchoolId: material.schoolId,
    materialStatus: material.status,
    sharedClassIds: material.sharedClassIds,
    enrolledClassIds,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền truy cập tài liệu này.',
      },
    };
  }

  return { success: true, data: material };
};

/**
 * Tải lên tài liệu học tập mới
 */
export const uploadMaterial = (
  params: UploadMaterialParams,
  userOverride?: UserProfile
): ApiResult<LearningMaterial> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để tải lên tài liệu.' },
    };
  }

  // 1. Kiểm tra quyền tải tài liệu
  const decision = checkPermission(user, 'material:create', {
    targetSchoolId: params.schoolId || user.schoolId,
  });

  if (!decision.allowed) {
    recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      targetType: 'material',
      details: `Từ chối tải tài liệu: ${decision.reason}`,
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền tải lên tài liệu học tập.',
      },
    };
  }

  // 2. Validate tiêu đề
  if (!params.title || !params.title.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Tiêu đề tài liệu không được để trống.' },
    };
  }

  // 3. Validate tệp an toàn (định dạng, kích thước, phần mở rộng)
  const validation = validateFileUpload(params.fileName, params.fileSize);
  if (!validation.valid) {
    return {
      success: false,
      error: { code: 'INVALID_FILE', message: validation.error || 'Tệp không hợp lệ.' },
    };
  }

  // 4. Nếu là giáo viên, xác thực rằng giáo viên chỉ chia sẻ với các lớp mình phụ trách
  const allClasses = getClassrooms();
  const schoolId = user.schoolId || params.schoolId || 'school-lhp';
  const sharedClassIds = params.sharedClassIds || [];

  if (user.role === 'teacher' && sharedClassIds.length > 0) {
    for (const classId of sharedClassIds) {
      const cls = allClasses.find((c) => c.id === classId);
      if (!cls) {
        return {
          success: false,
          error: { code: 'CLASS_NOT_FOUND', message: `Lớp học ID ${classId} không tồn tại.` },
        };
      }
      const isTeacherOfClass =
        cls.teacherId === user.id ||
        (cls.secondaryTeacherIds && cls.secondaryTeacherIds.includes(user.id));
      if (!isTeacherOfClass) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Bạn không thể chia sẻ tài liệu cho lớp "${cls.name}" vì không phải giáo viên phụ trách.`,
          },
        };
      }
    }
  }

  // 5. Tạo khóa định danh ngẫu nhiên cho tệp lưu trữ (Blob Storage Key)
  const randomSuffix = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const storageKey = `blob_mat_${randomSuffix}`;

  // Lưu trữ dữ liệu blob nội dung tệp riêng biệt
  if (params.fileData) {
    saveBlobContent(storageKey, params.fileData);
  } else {
    saveBlobContent(storageKey, `BLOB_CONTENT_FOR_${params.fileName}`);
  }

  const now = new Date().toISOString();
  const newMaterial: LearningMaterial = {
    id: `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: params.title.trim(),
    description: (params.description || '').trim(),
    originalFileName: params.fileName,
    storageKey,
    contentType: params.contentType || 'application/octet-stream',
    fileSize: params.fileSize,
    fileSizeFormatted: formatFileSize(params.fileSize),
    fileType: detectFileType(params.fileName),
    uploadedBy: user.id,
    uploadedByName: user.fullName,
    schoolId,
    subjectId: params.subjectId,
    subjectName: params.subjectName,
    topic: params.topic ? params.topic.trim() : undefined,
    status: params.status || 'published',
    sharedClassIds,
    downloadCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const materials = getAllMaterialsRaw();
  materials.unshift(newMaterial);
  saveMaterialsRaw(materials);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'MATERIAL_UPLOADED',
    targetType: 'material',
    targetId: newMaterial.id,
    schoolId,
    details: `Tải lên tài liệu "${newMaterial.title}" (${newMaterial.originalFileName}, ${newMaterial.fileSizeFormatted}).`,
    status: 'success',
  });

  return {
    success: true,
    data: newMaterial,
    message: 'Tải lên tài liệu học tập thành công.',
  };
};

/**
 * Cập nhật thông tin tài liệu học tập
 */
export const updateMaterial = (
  id: string,
  updates: UpdateMaterialParams,
  userOverride?: UserProfile
): ApiResult<LearningMaterial> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const materials = getAllMaterialsRaw();
  const index = materials.findIndex((m) => m.id === id);
  if (index === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
    };
  }

  const material = materials[index];

  // Thẩm định quyền sửa tài liệu
  const decision = checkPermission(user, 'material:update', {
    resourceSchoolId: material.schoolId,
    resourceOwnerId: material.uploadedBy,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền chỉnh sửa tài liệu này.',
      },
    };
  }

  if (updates.title !== undefined && !updates.title.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Tiêu đề tài liệu không được để trống.' },
    };
  }

  // Cập nhật
  const updatedMaterial: LearningMaterial = {
    ...material,
    title: updates.title !== undefined ? updates.title.trim() : material.title,
    description: updates.description !== undefined ? updates.description.trim() : material.description,
    subjectId: updates.subjectId !== undefined ? updates.subjectId : material.subjectId,
    subjectName: updates.subjectName !== undefined ? updates.subjectName : material.subjectName,
    topic: updates.topic !== undefined ? updates.topic.trim() : material.topic,
    status: updates.status !== undefined ? updates.status : material.status,
    sharedClassIds: updates.sharedClassIds !== undefined ? updates.sharedClassIds : material.sharedClassIds,
    updatedAt: new Date().toISOString(),
  };

  materials[index] = updatedMaterial;
  saveMaterialsRaw(materials);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'MATERIAL_UPDATED',
    targetType: 'material',
    targetId: material.id,
    schoolId: material.schoolId,
    details: `Cập nhật thông tin tài liệu "${updatedMaterial.title}".`,
    status: 'success',
  });

  return { success: true, data: updatedMaterial, message: 'Cập nhật tài liệu thành công.' };
};

/**
 * Chia sẻ tài liệu cho các lớp học
 */
export const shareMaterialWithClasses = (
  id: string,
  classIds: string[],
  userOverride?: UserProfile
): ApiResult<LearningMaterial> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const materials = getAllMaterialsRaw();
  const material = materials.find((m) => m.id === id);
  if (!material) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
    };
  }

  // Kiểm tra quyền chia sẻ
  const decision = checkPermission(user, 'material:share', {
    resourceSchoolId: material.schoolId,
    resourceOwnerId: material.uploadedBy,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền chia sẻ tài liệu này.',
      },
    };
  }

  // Giáo viên chỉ được chia sẻ cho lớp mình phụ trách
  if (user.role === 'teacher') {
    const allClasses = getClassrooms();
    for (const cid of classIds) {
      const cls = allClasses.find((c) => c.id === cid);
      if (!cls || (cls.teacherId !== user.id && !cls.secondaryTeacherIds?.includes(user.id))) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Bạn không thể chia sẻ tài liệu cho lớp mà bạn không phụ trách (ID: ${cid}).`,
          },
        };
      }
    }
  }

  material.sharedClassIds = Array.from(new Set(classIds));
  material.updatedAt = new Date().toISOString();
  saveMaterialsRaw(materials);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'MATERIAL_SHARED',
    targetType: 'material',
    targetId: material.id,
    schoolId: material.schoolId,
    details: `Chia sẻ tài liệu "${material.title}" cho ${classIds.length} lớp học.`,
    status: 'success',
  });

  return { success: true, data: material, message: 'Đã cập nhật danh sách lớp chia sẻ.' };
};

/**
 * Lưu trữ tài liệu (archive)
 */
export const archiveMaterial = (
  id: string,
  userOverride?: UserProfile
): ApiResult<LearningMaterial> => {
  return updateMaterial(id, { status: 'archived' }, userOverride);
};

/**
 * Xóa tài liệu học tập
 */
export const deleteMaterial = (
  id: string,
  userOverride?: UserProfile
): ApiResult<{ deleted: boolean }> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const materials = getAllMaterialsRaw();
  const material = materials.find((m) => m.id === id);
  if (!material) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
    };
  }

  const decision = checkPermission(user, 'material:delete', {
    resourceSchoolId: material.schoolId,
    resourceOwnerId: material.uploadedBy,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền xóa tài liệu này.',
      },
    };
  }

  const remaining = materials.filter((m) => m.id !== id);
  saveMaterialsRaw(remaining);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'MATERIAL_DELETED',
    targetType: 'material',
    targetId: material.id,
    schoolId: material.schoolId,
    details: `Xóa tài liệu "${material.title}".`,
    status: 'success',
  });

  return { success: true, data: { deleted: true }, message: 'Đã xóa tài liệu học tập.' };
};

/**
 * Tải tài liệu an toàn có xác thực và kiểm soát quyền truy cập
 */
export const getAuthorizedDownload = (
  materialId: string,
  userOverride?: UserProfile
): ApiResult<{
  fileName: string;
  contentType: string;
  fileSize: number;
  content: string;
}> => {
  const materialResult = getMaterialById(materialId, userOverride);
  if (!materialResult.success) {
    return { success: false, error: materialResult.error };
  }

  const material = materialResult.data;
  const user = userOverride || getCurrentUser();

  // Đọc nội dung blob qua storageKey
  const blobContent = getBlobContent(material.storageKey) || `[FILE_STREAM_DATA: ${material.originalFileName}]`;

  // Tăng lượt tải
  const materials = getAllMaterialsRaw();
  const idx = materials.findIndex((m) => m.id === material.id);
  if (idx !== -1) {
    materials[idx].downloadCount = (materials[idx].downloadCount || 0) + 1;
    saveMaterialsRaw(materials);
  }

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'MATERIAL_DOWNLOADED',
    targetType: 'material',
    targetId: material.id,
    schoolId: material.schoolId,
    details: `Người dùng ${user.fullName} (${user.role}) tải tài liệu "${material.title}".`,
    status: 'success',
  });

  return {
    success: true,
    data: {
      fileName: material.originalFileName,
      contentType: material.contentType,
      fileSize: material.fileSize,
      content: blobContent,
    },
    message: 'Xác thực quyền tải tài liệu thành công.',
  };
};
