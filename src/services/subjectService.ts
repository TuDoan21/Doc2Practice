import type { Subject, ApiResult } from '../types';
import { getCurrentUser } from './auth';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';

const SUBJECTS_KEY = 'd2p_subjects_v1';

export const initialSubjects: Subject[] = [
  // Danh mục môn học chuẩn dùng chung (Global)
  {
    id: 'sub-global-math',
    schoolId: 'global',
    subjectCode: 'MATH-GEN',
    name: 'Toán học (Đại số & Hình học)',
    description: 'Chương trình chuẩn theo khung GDPT & chuẩn kiến thức kỹ năng quốc gia.',
    gradeLevel: 'Toàn cấp',
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'sub-global-lit',
    schoolId: 'global',
    subjectCode: 'LIT-GEN',
    name: 'Ngữ văn',
    description: 'Văn học Việt Nam, Đọc hiểu văn bản và Làm văn nghị luận xã hội/văn học.',
    gradeLevel: 'Toàn cấp',
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'sub-global-eng',
    schoolId: 'global',
    subjectCode: 'ENG-GEN',
    name: 'Tiếng Anh',
    description: 'Ngữ pháp, từ vựng, đọc hiểu và kỹ năng thực hành ngôn ngữ.',
    gradeLevel: 'Toàn cấp',
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'sub-global-phy',
    schoolId: 'global',
    subjectCode: 'PHY-GEN',
    name: 'Vật lý',
    description: 'Cơ học, Nhiệt học, Điện từ học và Vật lý hiện đại.',
    gradeLevel: 'Toàn cấp',
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'sub-global-cs',
    schoolId: 'global',
    subjectCode: 'CS-GEN',
    name: 'Tin học & Khoa học Máy tính',
    description: 'Lập trình cơ sở, cấu trúc dữ liệu thuật toán và ứng dụng văn phòng.',
    gradeLevel: 'Toàn cấp',
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },

  // Môn học đặc thù chuyên biệt của từng trường
  {
    id: 'sub-lhp-web',
    schoolId: 'school-lhp',
    subjectCode: 'SE104-LHP',
    name: 'Công nghệ phần mềm & Lập trình Web',
    description: 'Chuyên đề nâng cao React, TypeScript và thiết kế kiến trúc phần mềm.',
    gradeLevel: 'Khối 12 / Chuyên Tin',
    status: 'active',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'sub-lhp-ai',
    schoolId: 'school-lhp',
    subjectCode: 'CS221-LHP',
    name: 'Nhập môn Trí tuệ Nhân tạo',
    description: 'Mô hình học máy, mạng nơ-ron và giải thuật tìm kiếm heuristic.',
    gradeLevel: 'Khối 12 / Chuyên Tin',
    status: 'active',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'sub-cva-advmath',
    schoolId: 'school-cva',
    subjectCode: 'MATH-CVA-ADV',
    name: 'Chuyên đề Giải tích & Tổ hợp Nâng cao (CVA)',
    description: 'Dành riêng cho các lớp chuyên Toán THPT Chu Văn An.',
    gradeLevel: 'Khối 11 - 12 Chuyên Toán',
    status: 'active',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  },
];

export const initSubjectStorage = (): Subject[] => {
  if (typeof localStorage === 'undefined') return initialSubjects;
  const raw = localStorage.getItem(SUBJECTS_KEY);
  if (!raw) {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(initialSubjects));
    return initialSubjects;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(initialSubjects));
    return initialSubjects;
  }
};

/**
 * Lấy danh sách môn học khả dụng cho trường học:
 * Gồm các môn dùng chung toàn quốc (global) + các môn riêng của trường.
 */
export const getSubjects = (params?: {
  schoolId?: string;
  gradeLevel?: string;
  status?: 'active' | 'inactive';
  search?: string;
}): Subject[] => {
  const subjects = initSubjectStorage();
  let result = subjects;

  const targetSchoolId = params?.schoolId;

  if (targetSchoolId && targetSchoolId !== 'all') {
    result = result.filter(
      (s) => !s.schoolId || s.schoolId === 'global' || s.schoolId === targetSchoolId
    );
  }

  if (params?.gradeLevel && params.gradeLevel !== 'all') {
    result = result.filter((s) => s.gradeLevel === params.gradeLevel || s.gradeLevel === 'Toàn cấp');
  }

  if (params?.status) {
    result = result.filter((s) => s.status === params.status);
  }

  if (params?.search) {
    const q = params.search.toLowerCase().trim();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.subjectCode.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }

  return result;
};

export const getSubjectById = (id: string): Subject | undefined => {
  const subjects = initSubjectStorage();
  return subjects.find((s) => s.id === id);
};

/**
 * Tạo môn học mới.
 * - System Admin: có thể tạo môn global hoặc môn cho bất kỳ trường nào.
 * - School Admin: chỉ có thể tạo môn thuộc trường của mình.
 * - Ngăn trùng SubjectCode trong cùng phạm vi trường.
 */
export const createSubject = (params: {
  subjectCode: string;
  name: string;
  description?: string;
  gradeLevel?: string;
  schoolId?: string;
}): ApiResult<Subject> => {
  const user = getCurrentUser();
  const decision = checkPermission(user, 'subject:manage', {
    resourceSchoolId: params.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền quản lý danh mục môn học.',
      },
    };
  }

  // School Admin bắt buộc gắn schoolId của trường mình, không được tạo global
  let assignedSchoolId = params.schoolId;
  if (user.role === 'school_admin') {
    assignedSchoolId = user.schoolId;
  } else if (!assignedSchoolId) {
    assignedSchoolId = 'global';
  }

  const subjects = initSubjectStorage();
  const normalizedCode = params.subjectCode.trim().toUpperCase();

  // Kiểm tra trùng mã môn trong cùng phạm vi
  const duplicate = subjects.find(
    (s) =>
      s.subjectCode.toUpperCase() === normalizedCode &&
      (s.schoolId === assignedSchoolId || s.schoolId === 'global')
  );

  if (duplicate) {
    return {
      success: false,
      error: {
        code: 'DUPLICATE_CODE',
        message: `Mã môn học "${normalizedCode}" đã tồn tại trong phạm vi ${
          assignedSchoolId === 'global' ? 'toàn hệ thống' : 'trường của bạn'
        }. Vui lòng chọn mã khác.`,
      },
    };
  }

  const newSubject: Subject = {
    id: `sub-${Date.now()}`,
    schoolId: assignedSchoolId,
    subjectCode: normalizedCode,
    name: params.name.trim(),
    description: params.description?.trim() || '',
    gradeLevel: params.gradeLevel || 'Toàn cấp',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  subjects.push(newSubject);
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SUBJECT_CREATED',
    targetType: 'subject',
    targetId: newSubject.id,
    schoolId: assignedSchoolId,
    details: `Tạo môn học mới: "${newSubject.name}" (${newSubject.subjectCode}) tại phạm vi ${assignedSchoolId}.`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('subjects_updated'));
  }

  return { success: true, data: newSubject, message: `Thêm môn học "${newSubject.name}" thành công!` };
};

/**
 * Cập nhật thông tin môn học
 */
export const updateSubject = (
  id: string,
  params: Partial<Pick<Subject, 'name' | 'subjectCode' | 'description' | 'gradeLevel' | 'status'>>
): ApiResult<Subject> => {
  const user = getCurrentUser();
  const subjects = initSubjectStorage();
  const index = subjects.findIndex((s) => s.id === id);

  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy môn học tương ứng.' } };
  }

  const currentSub = subjects[index];
  const decision = checkPermission(user, 'subject:manage', {
    resourceSchoolId: currentSub.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền sửa môn học này.',
      },
    };
  }

  if (params.subjectCode) {
    const normalizedCode = params.subjectCode.trim().toUpperCase();
    const duplicate = subjects.find(
      (s) =>
        s.id !== id &&
        s.subjectCode.toUpperCase() === normalizedCode &&
        s.schoolId === currentSub.schoolId
    );
    if (duplicate) {
      return {
        success: false,
        error: { code: 'DUPLICATE_CODE', message: `Mã môn "${normalizedCode}" đã bị trùng.` },
      };
    }
    params.subjectCode = normalizedCode;
  }

  const updated: Subject = {
    ...currentSub,
    ...params,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  subjects[index] = updated;
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SUBJECT_UPDATED',
    targetType: 'subject',
    targetId: id,
    schoolId: currentSub.schoolId,
    details: `Cập nhật môn học "${updated.name}" (${updated.subjectCode}).`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('subjects_updated'));
  }

  return { success: true, data: updated, message: 'Cập nhật môn học thành công.' };
};

/**
 * Bật hoặc Tắt trạng thái môn học
 */
export const toggleSubjectStatus = (id: string, newStatus: 'active' | 'inactive'): ApiResult<Subject> => {
  return updateSubject(id, { status: newStatus });
};

