import type {
  Classroom,
  ClassAssignment,
  StudentSubmission,
  AppNotification,
  UserRole,
  AssignmentType,
  ClassMaterial,
  ClassJoinRequest,
  ApiResult,
} from '../types';
import { getCurrentUser } from './auth';
import { mockClassMaterials } from '../data/mockData';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';
import { getSubjectById } from './subjectService';

const KEYS = {
  CLASSES: 'd2p_classes_v2',
  CLASSES_V1: 'd2p_classes_v1',
  JOIN_REQUESTS: 'd2p_class_join_requests_v1',
  ASSIGNMENTS: 'd2p_assignments_v1',
  SUBMISSIONS: 'd2p_submissions_v1',
  NOTIFICATIONS: 'd2p_notifications_v1',
  JOIN_ATTEMPTS: 'd2p_join_attempts_v1',
};

// Dữ liệu mẫu lớp học ban đầu
const initialClassrooms: Classroom[] = [
  {
    id: 'class-web-01',
    code: 'WEB-8821',
    name: 'Lập trình Web & TypeScript (SE104.P12)',
    subject: 'Công nghệ phần mềm & Lập trình Web',
    subjectId: 'sub-lhp-web',
    schoolId: 'school-lhp',
    gradeLevel: 'Khối 12 / Chuyên Tin',
    academicYear: '2026-2027',
    semester: 'Học kỳ 1',
    status: 'active',
    teacherId: 'usr-teacher-01',
    teacherName: 'ThS. Trần Thị Giáo Viên',
    description: 'Lớp học chuyên sâu về React, TypeScript, quản lý State và xây dựng ứng dụng web hiện đại.',
    studentCount: 38,
    studentIds: ['usr-student-01', 'usr-student-02', 'usr-student-03'],
    joinCodeActive: true,
    createdAt: '2026-10-10',
    updatedAt: '2026-10-10',
  },
  {
    id: 'class-ai-02',
    code: 'AI-2026',
    name: 'Nhập môn Trí tuệ Nhân tạo (CS221.N11)',
    subject: 'Nhập môn Trí tuệ Nhân tạo',
    subjectId: 'sub-lhp-ai',
    schoolId: 'school-lhp',
    gradeLevel: 'Khối 12 / Chuyên Tin',
    academicYear: '2026-2027',
    semester: 'Học kỳ 1',
    status: 'active',
    teacherId: 'usr-teacher-01',
    teacherName: 'ThS. Trần Thị Giáo Viên',
    description: 'Ôn tập kiến thức thuật toán tìm kiếm, Machine Learning cơ bản và mạng nơ-ron.',
    studentCount: 45,
    studentIds: ['usr-student-01', 'usr-student-04'],
    joinCodeActive: true,
    createdAt: '2026-10-12',
    updatedAt: '2026-10-12',
  },
  {
    id: 'class-math-03',
    code: 'CVA-M12',
    name: 'Toán Chuyên 12 - Giải tích & Tổ hợp',
    subject: 'Chuyên đề Giải tích & Tổ hợp Nâng cao (CVA)',
    subjectId: 'sub-cva-advmath',
    schoolId: 'school-cva',
    gradeLevel: 'Khối 12',
    academicYear: '2026-2027',
    semester: 'Cả năm',
    status: 'active',
    teacherId: 'usr-teacher-cva-01',
    teacherName: 'Thầy Nguyễn Văn CVA',
    description: 'Lớp bồi dưỡng học sinh giỏi Toán THPT Chu Văn An.',
    studentCount: 30,
    studentIds: ['usr-student-cva-01'],
    joinCodeActive: true,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  },
];

const initialJoinRequests: ClassJoinRequest[] = [
  {
    id: 'req-join-01',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    classCode: 'WEB-8821',
    schoolId: 'school-lhp',
    studentId: 'usr-student-05',
    studentName: 'Trần Minh Đức',
    studentEmail: 'duc.tm@uit.edu.vn',
    studentCode: 'HS-2026-12A2',
    status: 'pending',
    requestedAt: '2026-10-24 09:15',
  },
];

// Dữ liệu mẫu bài tập ban đầu
const initialAssignments: ClassAssignment[] = [
  {
    id: 'asg-01',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    title: 'Bài ôn tập: React Hooks & Props typing',
    quizSetId: 'quiz-react-ts',
    type: 'practice',
    durationMinutes: 20,
    preventTabSwitch: false,
    maxTabSwitchViolations: 0,
    dueDate: '2026-11-05',
    createdAt: '2026-10-20',
    totalQuestions: 5,
    submissionCount: 32,
  },
  {
    id: 'asg-02',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    title: 'Bài kiểm tra 30 phút: Kiến trúc Component & State (Khóa chuyển tab)',
    quizSetId: 'quiz-react-ts',
    type: 'exam',
    durationMinutes: 30,
    preventTabSwitch: true,
    maxTabSwitchViolations: 3,
    dueDate: '2026-11-10',
    createdAt: '2026-10-22',
    totalQuestions: 5,
    submissionCount: 14,
  },
  {
    id: 'asg-03',
    classId: 'class-ai-02',
    className: 'Nhập môn Trí tuệ Nhân tạo (CS221.N11)',
    title: 'Bài kiểm tra 15 phút: Học có giám sát & Gradient Descent',
    quizSetId: 'quiz-ai-docx',
    type: 'exam',
    durationMinutes: 15,
    preventTabSwitch: true,
    maxTabSwitchViolations: 3,
    dueDate: '2026-11-08',
    createdAt: '2026-10-23',
    totalQuestions: 5,
    submissionCount: 28,
  },
];

// Dữ liệu bài nộp mẫu của học sinh
const initialSubmissions: StudentSubmission[] = [
  {
    id: 'sub-01',
    assignmentId: 'asg-02',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    studentId: 'usr-student-02',
    studentName: 'Lê Hoàng Nam',
    studentEmail: 'nam.le@uit.edu.vn',
    score: 100,
    correctCount: 5,
    totalQuestions: 5,
    submittedAt: '2026-10-23 10:15',
    durationSeconds: 780,
    tabSwitchCount: 0,
    status: 'submitted',
  },
  {
    id: 'sub-02',
    assignmentId: 'asg-02',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    studentId: 'usr-student-03',
    studentName: 'Phạm Minh Trang',
    studentEmail: 'trang.pm@uit.edu.vn',
    score: 80,
    correctCount: 4,
    totalQuestions: 5,
    submittedAt: '2026-10-23 11:20',
    durationSeconds: 940,
    tabSwitchCount: 1,
    status: 'submitted',
  },
  {
    id: 'sub-03',
    assignmentId: 'asg-02',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    studentId: 'usr-student-04',
    studentName: 'Vũ Quốc Bảo',
    studentEmail: 'bao.vq@uit.edu.vn',
    score: 60,
    correctCount: 3,
    totalQuestions: 5,
    submittedAt: '2026-10-23 14:05',
    durationSeconds: 1100,
    tabSwitchCount: 4,
    status: 'violation_auto_submitted',
    lastViolationTime: '14:04',
  },
  {
    id: 'sub-04',
    assignmentId: 'asg-02',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    studentId: 'usr-student-05',
    studentName: 'Trần Minh Đức',
    studentEmail: 'duc.tm@uit.edu.vn',
    score: 0,
    correctCount: 0,
    totalQuestions: 5,
    submittedAt: 'Đang làm bài...',
    durationSeconds: 420,
    tabSwitchCount: 0,
    status: 'taking',
  },
  {
    id: 'sub-05',
    assignmentId: 'asg-02',
    classId: 'class-web-01',
    className: 'Lập trình Web & TypeScript (SE104.P12)',
    studentId: 'usr-student-06',
    studentName: 'Đỗ Hoàng Long',
    studentEmail: 'long.dh@uit.edu.vn',
    score: 0,
    correctCount: 0,
    totalQuestions: 5,
    submittedAt: 'Đang làm bài...',
    durationSeconds: 610,
    tabSwitchCount: 2,
    lastViolationTime: '14:12',
    status: 'taking',
  },
];

// Thông báo mẫu
const initialNotifications: AppNotification[] = [
  {
    id: 'notif-01',
    recipientRole: 'teacher',
    title: 'Học sinh nộp bài kiểm tra',
    message: 'Phạm Minh Trang vừa nộp bài "Kiến trúc Component & State" - Đạt 80% (Cảnh báo: 1 lần rời màn hình thi).',
    type: 'submission',
    createdAt: '15 phút trước',
    read: false,
    link: '/app/classes',
  },
  {
    id: 'notif-02',
    recipientRole: 'teacher',
    title: 'Cảnh báo gian lận thi cử',
    message: 'Học sinh Vũ Quốc Bảo vi phạm chuyển tab 4 lần trong bài thi "Kiến trúc Component & State". Hệ thống đã tự động thu bài.',
    type: 'violation',
    createdAt: '1 giờ trước',
    read: false,
    link: '/app/classes',
  },
  {
    id: 'notif-03',
    recipientRole: 'student',
    title: 'Bài kiểm tra mới được giao',
    message: 'ThS. Trần Thị Giáo Viên vừa giao bài kiểm tra mới: "Kiến trúc Component & State (Khóa chuyển tab)" - Hạn chót: 10/11/2026.',
    type: 'assignment',
    createdAt: 'Hôm qua',
    read: false,
    link: '/app/classes',
  },
];

export const initClassStorage = () => {
  if (typeof localStorage === 'undefined') return;

  // Migration tương thích: Nếu có classes_v1, chuyển đổi sang classes_v2 và giữ nguyên dữ liệu
  if (!localStorage.getItem(KEYS.CLASSES)) {
    const rawV1 = localStorage.getItem(KEYS.CLASSES_V1);
    if (rawV1) {
      try {
        const v1Classes: Classroom[] = JSON.parse(rawV1);
        const migrated = v1Classes.map((c) => ({
          ...c,
          schoolId: c.schoolId || 'school-lhp',
          status: c.status || 'active',
          joinCodeActive: c.joinCodeActive ?? true,
          academicYear: c.academicYear || '2026-2027',
          gradeLevel: c.gradeLevel || 'Khối 12',
          updatedAt: c.createdAt,
        }));
        localStorage.setItem(KEYS.CLASSES, JSON.stringify(migrated));
      } catch {
        localStorage.setItem(KEYS.CLASSES, JSON.stringify(initialClassrooms));
      }
    } else {
      localStorage.setItem(KEYS.CLASSES, JSON.stringify(initialClassrooms));
    }
  }

  if (!localStorage.getItem(KEYS.JOIN_REQUESTS)) {
    localStorage.setItem(KEYS.JOIN_REQUESTS, JSON.stringify(initialJoinRequests));
  }
  if (!localStorage.getItem(KEYS.ASSIGNMENTS)) {
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(initialAssignments));
  }
  if (!localStorage.getItem(KEYS.SUBMISSIONS)) {
    localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(initialSubmissions));
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
  }
};

// ==================== CLASSROOMS ====================

export const getAllClassroomsRaw = (): Classroom[] => {
  initClassStorage();
  try {
    const raw = localStorage.getItem(KEYS.CLASSES);
    return raw ? JSON.parse(raw) : initialClassrooms;
  } catch {
    return initialClassrooms;
  }
};

/**
 * Lấy danh sách lớp học theo đúng phân quyền (RBAC & Multi-tenancy Scoping)
 * - System Admin: xem toàn bộ lớp học.
 * - School Admin: xem toàn bộ lớp thuộc trường mình.
 * - Teacher: xem các lớp do mình phụ trách (chính hoặc phụ).
 * - Student: xem các lớp mình đã được duyệt tham gia.
 */
export const getClassrooms = (filter?: {
  schoolId?: string;
  subjectId?: string;
  gradeLevel?: string;
  academicYear?: string;
  status?: 'active' | 'archived' | 'all';
  search?: string;
}): Classroom[] => {
  const user = getCurrentUser();
  const all = getAllClassroomsRaw();
  let list = all;

  // Lọc theo vai trò người dùng (Data Scoping)
  if (user) {
    if (user.role === 'school_admin') {
      list = list.filter((c) => c.schoolId === user.schoolId);
    } else if (user.role === 'teacher') {
      list = list.filter(
        (c) =>
          c.teacherId === user.id ||
          (c.secondaryTeacherIds && c.secondaryTeacherIds.includes(user.id))
      );
    } else if (user.role === 'student') {
      list = list.filter((c) => c.studentIds && c.studentIds.includes(user.id));
    }
  }

  // Áp dụng bộ lọc tùy chọn
  if (filter?.schoolId && filter.schoolId !== 'all') {
    list = list.filter((c) => c.schoolId === filter.schoolId);
  }
  if (filter?.subjectId && filter.subjectId !== 'all') {
    list = list.filter((c) => c.subjectId === filter.subjectId);
  }
  if (filter?.gradeLevel && filter.gradeLevel !== 'all') {
    list = list.filter((c) => c.gradeLevel === filter.gradeLevel);
  }
  if (filter?.academicYear && filter.academicYear !== 'all') {
    list = list.filter((c) => c.academicYear === filter.academicYear);
  }
  if (filter?.status && filter.status !== 'all') {
    list = list.filter((c) => (c.status || 'active') === filter.status);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.teacherName.toLowerCase().includes(q)
    );
  }

  return list;
};

export const getClassroomById = (id: string): Classroom | undefined => {
  const all = getAllClassroomsRaw();
  return all.find((c) => c.id === id);
};

/**
 * Tạo lớp học mới.
 * Kiểm tra:
 * - Quyền tạo lớp (`class:create`).
 * - Không cho giáo viên tạo lớp cho trường khác.
 * - Kiểm tra SubjectId: không được dùng môn học riêng của trường khác.
 */
export const createClassroom = (params: {
  name: string;
  subject: string;
  subjectId?: string;
  description: string;
  schoolId?: string;
  gradeLevel?: string;
  academicYear?: string;
  semester?: string;
  teacherId?: string;
  teacherName?: string;
}): ApiResult<Classroom> => {
  const user = getCurrentUser();

  // Xác định trường mục tiêu
  const targetSchoolId = params.schoolId || user?.schoolId || 'school-lhp';

  const decision = checkPermission(user, 'class:create', {
    targetSchoolId,
    resourceSchoolId: targetSchoolId,
  });

  if (!decision.allowed) {
    recordAuditLog({
      actorId: user?.id || 'anonymous',
      actorEmail: user?.email || '',
      actorRole: user?.role || 'anonymous',
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      targetType: 'classroom',
      details: decision.reason || 'Từ chối quyền tạo lớp học.',
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Ràng buộc bảo mật: Bạn không có quyền tạo lớp học.',
      },
    };
  }

  // Kiểm tra môn học nếu có subjectId: Môn học không được thuộc về trường khác
  if (params.subjectId) {
    const subj = getSubjectById(params.subjectId);
    if (subj && subj.schoolId && subj.schoolId !== 'global' && subj.schoolId !== targetSchoolId) {
      return {
        success: false,
        error: {
          code: 'INVALID_SUBJECT_SCOPE',
          message: `Môn học "${subj.name}" thuộc quyền quản lý của trường khác (${subj.schoolId}), không thể dùng cho lớp thuộc trường ${targetSchoolId}.`,
        },
      };
    }
  }

  const classes = getAllClassroomsRaw();

  // Tạo mã lớp 6-8 ký tự duy nhất
  let code = '';
  let isUnique = false;
  let attempts = 0;
  const prefix = params.subject.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CLS');

  while (!isUnique && attempts < 10) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    code = `${prefix}-${randomSuffix}`;
    if (!classes.some((c) => c.code.toUpperCase() === code)) {
      isUnique = true;
    }
    attempts++;
  }

  const assignedTeacherId = params.teacherId || user.id;
  const assignedTeacherName = params.teacherName || user.fullName;

  const newClass: Classroom = {
    id: `class-${Date.now()}`,
    code,
    name: params.name.trim(),
    subject: params.subject.trim(),
    subjectId: params.subjectId,
    schoolId: targetSchoolId,
    gradeLevel: params.gradeLevel || 'Khối 12',
    academicYear: params.academicYear || '2026-2027',
    semester: params.semester || 'Học kỳ 1',
    status: 'active',
    teacherId: assignedTeacherId,
    teacherName: assignedTeacherName,
    description: params.description.trim() || 'Lớp học trực tuyến trên Doc2Practice.',
    studentCount: 0,
    studentIds: [],
    joinCodeActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  classes.unshift(newClass);
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASSROOM_CREATED',
    targetType: 'classroom',
    targetId: newClass.id,
    schoolId: newClass.schoolId,
    details: `Tạo lớp học mới: "${newClass.name}" (${newClass.code}) tại trường ${newClass.schoolId}.`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return { success: true, data: newClass, message: `Tạo thành công lớp học "${newClass.name}"!` };
};

/**
 * Cập nhật thông tin lớp học
 */
export const updateClassroom = (
  id: string,
  params: Partial<
    Pick<
      Classroom,
      'name' | 'description' | 'subject' | 'subjectId' | 'gradeLevel' | 'academicYear' | 'semester' | 'teacherId' | 'teacherName'
    >
  >
): ApiResult<Classroom> => {
  const user = getCurrentUser();
  const classes = getAllClassroomsRaw();
  const index = classes.findIndex((c) => c.id === id);

  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  const currentClass = classes[index];
  const decision = checkPermission(user, 'class:update', {
    resourceTeacherId: currentClass.teacherId,
    resourceSchoolId: currentClass.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: { code: decision.code || 'FORBIDDEN', message: decision.reason || 'Bạn không có quyền sửa lớp này.' },
    };
  }

  const updated: Classroom = {
    ...currentClass,
    ...params,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  classes[index] = updated;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASSROOM_UPDATED',
    targetType: 'classroom',
    targetId: id,
    schoolId: currentClass.schoolId,
    details: `Cập nhật thông tin lớp: "${updated.name}" (${updated.code}).`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return { success: true, data: updated, message: 'Cập nhật thông tin lớp thành công.' };
};

/**
 * Đóng hoặc Lưu trữ lớp học khi kết thúc năm học (Archive Classroom)
 */
export const archiveClassroom = (id: string, archive: boolean = true): ApiResult<Classroom> => {
  const user = getCurrentUser();
  const classes = getAllClassroomsRaw();
  const index = classes.findIndex((c) => c.id === id);

  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  const currentClass = classes[index];
  const decision = checkPermission(user, 'class:update', {
    resourceTeacherId: currentClass.teacherId,
    resourceSchoolId: currentClass.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: { code: decision.code || 'FORBIDDEN', message: decision.reason || 'Không đủ thẩm quyền lưu trữ lớp.' },
    };
  }

  currentClass.status = archive ? 'archived' : 'active';
  currentClass.joinCodeActive = !archive; // Khi lưu trữ thì tự động tắt mã tham gia
  currentClass.updatedAt = new Date().toISOString().split('T')[0];

  classes[index] = currentClass;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_ARCHIVED',
    targetType: 'classroom',
    targetId: id,
    schoolId: currentClass.schoolId,
    details: `${archive ? 'Lưu trữ/Đóng' : 'Mở lại'} lớp "${currentClass.name}" (${currentClass.code}).`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return {
    success: true,
    data: currentClass,
    message: archive ? `Đã lưu trữ lớp "${currentClass.name}".` : `Đã mở lại lớp "${currentClass.name}".`,
  };
};

/**
 * Phân công giáo viên phụ trách lớp (Dành cho School Admin)
 */
export const assignTeacherToClass = (params: {
  classId: string;
  teacherId: string;
  teacherName: string;
}): ApiResult<Classroom> => {
  const user = getCurrentUser();
  const classes = getAllClassroomsRaw();
  const index = classes.findIndex((c) => c.id === params.classId);

  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  const currentClass = classes[index];
  const decision = checkPermission(user, 'class:assign_teacher', {
    resourceSchoolId: currentClass.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: { code: decision.code || 'FORBIDDEN', message: decision.reason || 'Chỉ School Admin của trường mới có quyền phân công giáo viên.' },
    };
  }

  currentClass.teacherId = params.teacherId;
  currentClass.teacherName = params.teacherName;
  currentClass.updatedAt = new Date().toISOString().split('T')[0];

  classes[index] = currentClass;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_TEACHER_ASSIGNED',
    targetType: 'classroom',
    targetId: currentClass.id,
    schoolId: currentClass.schoolId,
    details: `Phân công giáo viên "${params.teacherName}" (${params.teacherId}) phụ trách lớp "${currentClass.name}".`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return { success: true, data: currentClass, message: `Đã phân công ${params.teacherName} phụ trách lớp.` };
};

// ==================== PHẦN 5: THAM GIA LỚP BẰNG MÃ & PHÊ DUYỆT ====================

/**
 * Kiểm tra giới hạn số lần nhập mã sai để chống brute-force / dò mã lớp
 */
const checkJoinRateLimit = (userId: string): { allowed: boolean; waitSeconds?: number } => {
  if (typeof localStorage === 'undefined') return { allowed: true };
  try {
    const raw = localStorage.getItem(KEYS.JOIN_ATTEMPTS);
    const store = raw ? JSON.parse(raw) : {};
    const record = store[userId];
    const now = Date.now();

    if (record) {
      if (record.lockedUntil && record.lockedUntil > now) {
        return { allowed: false, waitSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
      }
      if (record.resetAt && record.resetAt < now) {
        // Reset sau 2 phút
        delete store[userId];
        localStorage.setItem(KEYS.JOIN_ATTEMPTS, JSON.stringify(store));
      }
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
};

const recordJoinAttemptFailure = (userId: string) => {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(KEYS.JOIN_ATTEMPTS);
    const store = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const record = store[userId] || { count: 0, resetAt: now + 120000 };

    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 120000; // Khóa 2 phút
    }
    store[userId] = record;
    localStorage.setItem(KEYS.JOIN_ATTEMPTS, JSON.stringify(store));
  } catch {
    // ignore
  }
};

/**
 * Xem trước thông tin lớp học bằng mã mời trước khi xác nhận gửi yêu cầu tham gia (Preview Class)
 */
export const previewClassByCode = (
  code: string
): ApiResult<{
  id: string;
  code: string;
  name: string;
  subject: string;
  teacherName: string;
  gradeLevel?: string;
  academicYear?: string;
  schoolId: string;
  studentCount: number;
  description: string;
}> => {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để kiểm tra mã lớp học.' } };
  }

  const rate = checkJoinRateLimit(user.id);
  if (!rate.allowed) {
    return {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Bạn đã thử nhập mã sai quá nhiều lần. Vui lòng chờ ${rate.waitSeconds} giây trước khi thử lại.`,
      },
    };
  }

  const normalizedCode = code.trim().toUpperCase();
  const classes = getAllClassroomsRaw();
  const found = classes.find((c) => c.code.toUpperCase() === normalizedCode);

  if (!found) {
    recordJoinAttemptFailure(user.id);
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Mã lớp học không tồn tại. Vui lòng kiểm tra lại ký tự và dấu gạch nối.' },
    };
  }

  if (found.status === 'archived') {
    return {
      success: false,
      error: { code: 'CLASS_ARCHIVED', message: 'Lớp học này đã kết thúc hoặc được lưu trữ, hiện không nhận thêm học sinh.' },
    };
  }

  if (found.joinCodeActive === false) {
    return {
      success: false,
      error: { code: 'JOIN_CODE_DISABLED', message: 'Giáo viên hiện đã tạm khóa chức năng tham gia bằng mã cho lớp học này.' },
    };
  }

  return {
    success: true,
    data: {
      id: found.id,
      code: found.code,
      name: found.name,
      subject: found.subject,
      teacherName: found.teacherName,
      gradeLevel: found.gradeLevel,
      academicYear: found.academicYear,
      schoolId: found.schoolId,
      studentCount: found.studentCount,
      description: found.description,
    },
  };
};

/**
 * Gửi yêu cầu tham gia lớp học bằng mã (Học sinh gửi yêu cầu -> Trạng thái Pending)
 */
export const requestJoinClassByCode = (code: string): ApiResult<ClassJoinRequest> => {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập tài khoản học sinh.' } };
  }

  const preview = previewClassByCode(code);
  if (!preview.success) {
    return preview as any;
  }

  const targetClass = getClassroomById(preview.data.id);
  if (!targetClass) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  // 1. Kiểm tra đã là thành viên lớp chưa
  if (targetClass.studentIds && targetClass.studentIds.includes(user.id)) {
    return {
      success: false,
      error: { code: 'ALREADY_ENROLLED', message: 'Bạn đã là thành viên chính thức của lớp học này.' },
    };
  }

  // 2. Kiểm tra yêu cầu tham gia trùng lặp đang chờ duyệt
  const requests = getJoinRequestsRaw();
  const existingPending = requests.find(
    (r) => r.classId === targetClass.id && r.studentId === user.id && r.status === 'pending'
  );
  if (existingPending) {
    return {
      success: false,
      error: {
        code: 'REQUEST_ALREADY_PENDING',
        message: 'Bạn đã gửi yêu cầu tham gia lớp này trước đó. Vui lòng chờ giáo viên duyệt hồ sơ.',
      },
    };
  }

  const newRequest: ClassJoinRequest = {
    id: `req-join-${Date.now()}`,
    classId: targetClass.id,
    className: targetClass.name,
    classCode: targetClass.code,
    schoolId: targetClass.schoolId,
    studentId: user.id,
    studentName: user.fullName,
    studentEmail: user.email,
    studentCode: user.studentCode,
    status: 'pending',
    requestedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
  };

  requests.unshift(newRequest);
  localStorage.setItem(KEYS.JOIN_REQUESTS, JSON.stringify(requests));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_JOIN_REQUESTED',
    targetType: 'join_request',
    targetId: newRequest.id,
    schoolId: targetClass.schoolId,
    details: `Học sinh ${user.fullName} (${user.email}) xin gia nhập lớp "${targetClass.name}" (${targetClass.code}).`,
    status: 'success',
  });

  // Gửi thông báo cho giáo viên phụ trách lớp
  addNotification({
    recipientRole: 'teacher',
    recipientUserId: targetClass.teacherId,
    title: 'Yêu cầu vào lớp học mới',
    message: `Học sinh ${user.fullName} (${user.studentCode || user.email}) gửi yêu cầu tham gia lớp "${targetClass.name}".`,
    type: 'approval',
    link: `/app/classes?classId=${targetClass.id}&tab=requests`,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('join_requests_updated'));
  }

  return {
    success: true,
    data: newRequest,
    message: `Đã gửi yêu cầu tham gia lớp "${targetClass.name}". Vui lòng chờ giáo viên phê duyệt!`,
  };
};

export const getJoinRequestsRaw = (): ClassJoinRequest[] => {
  initClassStorage();
  try {
    const raw = localStorage.getItem(KEYS.JOIN_REQUESTS);
    return raw ? JSON.parse(raw) : initialJoinRequests;
  } catch {
    return initialJoinRequests;
  }
};

/**
 * Lấy danh sách yêu cầu xin vào lớp cho Giáo viên hoặc School Admin
 */
export const getJoinRequests = (classId?: string): ClassJoinRequest[] => {
  const user = getCurrentUser();
  const all = getJoinRequestsRaw();
  if (!user) return [];

  let filtered = all;

  if (classId) {
    filtered = filtered.filter((r) => r.classId === classId);
  } else if (user.role === 'teacher') {
    // Chỉ lấy các yêu cầu của các lớp giáo viên này phụ trách
    const myClasses = getClassrooms();
    const myClassIds = myClasses.map((c) => c.id);
    filtered = filtered.filter((r) => myClassIds.includes(r.classId));
  } else if (user.role === 'school_admin') {
    filtered = filtered.filter((r) => r.schoolId === user.schoolId);
  }

  return filtered;
};

/**
 * Lấy danh sách yêu cầu xin vào lớp của chính học sinh đang đăng nhập
 */
export const getStudentJoinRequests = (): ClassJoinRequest[] => {
  const user = getCurrentUser();
  if (!user) return [];
  const all = getJoinRequestsRaw();
  return all.filter((r) => r.studentId === user.id);
};

/**
 * Giáo viên hoặc School Admin duyệt yêu cầu tham gia lớp
 */
export const approveJoinRequest = (requestId: string): ApiResult<ClassJoinRequest> => {
  const user = getCurrentUser();
  const requests = getJoinRequestsRaw();
  const reqIndex = requests.findIndex((r) => r.id === requestId);

  if (reqIndex === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy yêu cầu tham gia.' } };
  }

  const req = requests[reqIndex];
  const targetClass = getClassroomById(req.classId);

  if (!targetClass) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Lớp học không còn tồn tại.' } };
  }

  const decision = checkPermission(user, 'class:review_requests', {
    resourceTeacherId: targetClass.teacherId,
    resourceSchoolId: targetClass.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: { code: decision.code || 'FORBIDDEN', message: decision.reason || 'Bạn không có quyền duyệt yêu cầu của lớp học này.' },
    };
  }

  // Thêm học sinh vào lớp (ngăn trùng lặp)
  const classes = getAllClassroomsRaw();
  const classIdx = classes.findIndex((c) => c.id === targetClass.id);
  if (classIdx !== -1) {
    const cls = classes[classIdx];
    if (!cls.studentIds.includes(req.studentId)) {
      cls.studentIds.push(req.studentId);
      cls.studentCount = cls.studentIds.length;
      cls.updatedAt = new Date().toISOString().split('T')[0];
      classes[classIdx] = cls;
      localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
    }
  }

  // Cập nhật trạng thái yêu cầu
  req.status = 'approved';
  req.reviewedAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
  req.reviewedBy = user.fullName;
  requests[reqIndex] = req;
  localStorage.setItem(KEYS.JOIN_REQUESTS, JSON.stringify(requests));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_JOIN_APPROVED',
    targetType: 'join_request',
    targetId: req.id,
    schoolId: targetClass.schoolId,
    details: `${user.fullName} đã chấp nhận học sinh ${req.studentName} vào lớp "${targetClass.name}".`,
    status: 'success',
  });

  // Gửi thông báo đến học sinh
  addNotification({
    recipientRole: 'student',
    recipientUserId: req.studentId,
    title: 'Yêu cầu vào lớp đã được phê duyệt',
    message: `Chúc mừng! Giáo viên đã duyệt bạn vào lớp "${targetClass.name}". Bạn đã có thể bắt đầu làm bài tập và xem tài liệu.`,
    type: 'approval',
    link: `/app/classes?classId=${targetClass.id}`,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('join_requests_updated'));
    window.dispatchEvent(new Event('classes_updated'));
  }

  return { success: true, data: req, message: `Đã duyệt học sinh ${req.studentName} vào lớp.` };
};

/**
 * Từ chối yêu cầu tham gia lớp
 */
export const rejectJoinRequest = (requestId: string, reason?: string): ApiResult<ClassJoinRequest> => {
  const user = getCurrentUser();
  const requests = getJoinRequestsRaw();
  const reqIndex = requests.findIndex((r) => r.id === requestId);

  if (reqIndex === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy yêu cầu tham gia.' } };
  }

  const req = requests[reqIndex];
  const targetClass = getClassroomById(req.classId);

  if (!targetClass) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Lớp học không còn tồn tại.' } };
  }

  const decision = checkPermission(user, 'class:review_requests', {
    resourceTeacherId: targetClass.teacherId,
    resourceSchoolId: targetClass.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: { code: decision.code || 'FORBIDDEN', message: decision.reason || 'Bạn không có quyền từ chối yêu cầu của lớp này.' },
    };
  }

  req.status = 'rejected';
  req.rejectReason = reason?.trim() || 'Hồ sơ không khớp với danh sách sĩ số của lớp.';
  req.reviewedAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
  req.reviewedBy = user.fullName;
  requests[reqIndex] = req;
  localStorage.setItem(KEYS.JOIN_REQUESTS, JSON.stringify(requests));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_JOIN_REJECTED',
    targetType: 'join_request',
    targetId: req.id,
    schoolId: targetClass.schoolId,
    details: `${user.fullName} từ chối yêu cầu vào lớp của học sinh ${req.studentName}. Lý do: ${req.rejectReason}`,
    status: 'success',
  });

  // Gửi thông báo đến học sinh
  addNotification({
    recipientRole: 'student',
    recipientUserId: req.studentId,
    title: 'Yêu cầu vào lớp bị từ chối',
    message: `Yêu cầu vào lớp "${targetClass.name}" chưa được chấp thuận. Lý do: ${req.rejectReason}`,
    type: 'info',
    link: '/app/classes',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('join_requests_updated'));
  }

  return { success: true, data: req, message: `Đã từ chối yêu cầu của ${req.studentName}.` };
};

/**
 * Tạo lại mã mời khi mã cũ bị lộ (Regenerate Class Code)
 */
export const regenerateClassCode = (classId: string): ApiResult<string> => {
  const user = getCurrentUser();
  const classes = getAllClassroomsRaw();
  const index = classes.findIndex((c) => c.id === classId);

  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  const cls = classes[index];
  const decision = checkPermission(user, 'class:update', {
    resourceTeacherId: cls.teacherId,
    resourceSchoolId: cls.schoolId,
  });

  if (!decision.allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền cấp lại mã cho lớp này.' } };
  }

  const prefix = cls.subject.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CLS');
  const newCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  cls.code = newCode;
  cls.updatedAt = new Date().toISOString().split('T')[0];
  classes[index] = cls;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_CODE_REGENERATED',
    targetType: 'classroom',
    targetId: cls.id,
    schoolId: cls.schoolId,
    details: `Tạo mới mã tham gia lớp "${cls.name}": Mã mới là ${newCode}.`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return { success: true, data: newCode, message: `Đã tạo mã tham gia mới: ${newCode}` };
};

/**
 * Tạm bật hoặc tắt chức năng nhận học sinh bằng mã (Toggle Join Code Active)
 */
export const toggleJoinCodeStatus = (classId: string, active: boolean): ApiResult<Classroom> => {
  const user = getCurrentUser();
  const classes = getAllClassroomsRaw();
  const index = classes.findIndex((c) => c.id === classId);

  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  const cls = classes[index];
  const decision = checkPermission(user, 'class:update', {
    resourceTeacherId: cls.teacherId,
    resourceSchoolId: cls.schoolId,
  });

  if (!decision.allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền sửa cấu hình lớp này.' } };
  }

  cls.joinCodeActive = active;
  cls.updatedAt = new Date().toISOString().split('T')[0];
  classes[index] = cls;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return {
    success: true,
    data: cls,
    message: active ? 'Đã bật nhận học sinh qua mã mời.' : 'Đã tạm khóa nhận học sinh qua mã mời.',
  };
};

/**
 * Giáo viên hoặc School Admin loại học sinh ra khỏi lớp
 */
export const removeStudentFromClass = (classId: string, studentId: string): ApiResult<Classroom> => {
  const user = getCurrentUser();
  const classes = getAllClassroomsRaw();
  const index = classes.findIndex((c) => c.id === classId);

  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  const cls = classes[index];
  const decision = checkPermission(user, 'class:update', {
    resourceTeacherId: cls.teacherId,
    resourceSchoolId: cls.schoolId,
  });

  if (!decision.allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền loại học sinh khỏi lớp này.' } };
  }

  cls.studentIds = cls.studentIds.filter((id) => id !== studentId);
  cls.studentCount = cls.studentIds.length;
  cls.updatedAt = new Date().toISOString().split('T')[0];
  classes[index] = cls;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_STUDENT_REMOVED',
    targetType: 'classroom',
    targetId: cls.id,
    schoolId: cls.schoolId,
    details: `${user.fullName} đã xóa học sinh (${studentId}) khỏi lớp "${cls.name}".`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return { success: true, data: cls, message: 'Đã xóa học sinh khỏi danh sách lớp.' };
};

/**
 * Học sinh tự nguyện rời lớp học
 */
export const leaveClassroom = (classId: string): ApiResult<boolean> => {
  const user = getCurrentUser();
  if (!user || user.role !== 'student') {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Chỉ tài khoản học sinh mới có thể rời lớp.' } };
  }

  const classes = getAllClassroomsRaw();
  const index = classes.findIndex((c) => c.id === classId);
  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy lớp học.' } };
  }

  const cls = classes[index];
  cls.studentIds = cls.studentIds.filter((id) => id !== user.id);
  cls.studentCount = cls.studentIds.length;
  classes[index] = cls;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CLASS_STUDENT_LEFT',
    targetType: 'classroom',
    targetId: cls.id,
    schoolId: cls.schoolId,
    details: `Học sinh ${user.fullName} (${user.email}) tự rời khỏi lớp "${cls.name}".`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classes_updated'));
  }

  return { success: true, data: true, message: `Bạn đã rời khỏi lớp "${cls.name}".` };
};

/**
 * Tương thích ngược: Cho phép tham gia trực tiếp nếu cấu hình cho phép, hoặc chuyển sang quy trình phê duyệt
 */
export const joinClassroomByCode = (
  code: string
): { success: boolean; message: string; classroom?: Classroom } => {
  const req = requestJoinClassByCode(code);
  if (!req.success) {
    return { success: false, message: req.error.message };
  }
  const cls = getClassroomById(req.data.classId);
  return {
    success: true,
    message: req.message || 'Đã gửi yêu cầu tham gia lớp!',
    classroom: cls,
  };
};

// ==================== CLASS MATERIALS (TÀI LIỆU LỚP HỌC) ====================

export const getClassMaterials = (classId: string): ClassMaterial[] => {
  return mockClassMaterials.filter((m) => m.classId === classId);
};

export const addClassMaterial = (params: {
  classId: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'text';
}): ClassMaterial => {
  const user = getCurrentUser();
  const newMat: ClassMaterial = {
    id: `mat-${Date.now()}`,
    classId: params.classId,
    title: params.title,
    fileName: params.fileName,
    fileSize: params.fileSize,
    fileType: params.fileType,
    uploadedBy: user.fullName,
    uploadedAt: new Date().toLocaleDateString('vi-VN'),
    downloadCount: 0,
  };
  mockClassMaterials.unshift(newMat);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('class_materials_updated'));
  }
  return newMat;
};

// ==================== ASSIGNMENTS (BÀI TẬP & BÀI KIỂM TRA) ====================

export const getAssignments = (): ClassAssignment[] => {
  initClassStorage();
  try {
    const raw = localStorage.getItem(KEYS.ASSIGNMENTS);
    return raw ? JSON.parse(raw) : initialAssignments;
  } catch {
    return initialAssignments;
  }
};

export const getAssignmentsByClass = (classId: string): ClassAssignment[] => {
  return getAssignments().filter((a) => a.classId === classId);
};

export const getAssignmentById = (id: string): ClassAssignment | undefined => {
  return getAssignments().find((a) => a.id === id);
};

export const createAssignment = (params: {
  classId: string;
  title: string;
  quizSetId: string;
  type: AssignmentType;
  durationMinutes: number;
  preventTabSwitch: boolean;
  maxTabSwitchViolations?: number;
  dueDate: string;
  totalQuestions: number;
}): ClassAssignment => {
  const user = getCurrentUser();
  const classroom = getClassroomById(params.classId);

  const decision = checkPermission(user, 'assignment:create', {
    resourceTeacherId: classroom?.teacherId,
    resourceSchoolId: classroom?.schoolId,
  });

  if (!decision.allowed) {
    recordAuditLog({
      actorId: user?.id || 'anonymous',
      actorEmail: user?.email || '',
      actorRole: user?.role || 'anonymous',
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      targetType: 'assignment',
      details: decision.reason || 'Ràng buộc bảo mật: Từ chối quyền tạo bài kiểm tra.',
      status: 'failure',
    });
    throw new Error(decision.reason || 'Ràng buộc bảo mật: Bạn không có quyền giao bài tập/thi cho lớp học này.');
  }

  const assignments = getAssignments();

  const newAssignment: ClassAssignment = {
    id: `asg-${Date.now()}`,
    classId: params.classId,
    className: classroom ? classroom.name : 'Lớp học',
    title: params.title,
    quizSetId: params.quizSetId,
    type: params.type,
    durationMinutes: params.durationMinutes,
    preventTabSwitch: params.preventTabSwitch,
    maxTabSwitchViolations: params.preventTabSwitch ? (params.maxTabSwitchViolations || 3) : 0,
    dueDate: params.dueDate,
    createdAt: new Date().toISOString().split('T')[0],
    totalQuestions: params.totalQuestions,
    submissionCount: 0,
  };

  assignments.unshift(newAssignment);
  localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSIGNMENT_CREATED',
    targetType: 'assignment',
    targetId: newAssignment.id,
    schoolId: classroom?.schoolId,
    details: `Tạo bài kiểm tra "${newAssignment.title}" (${newAssignment.type}) trong lớp ${newAssignment.className}.`,
    status: 'success',
  });

  addNotification({
    recipientRole: 'student',
    title: params.type === 'exam' ? 'Bài kiểm tra mới' : 'Bài ôn tập mới',
    message: `Giáo viên vừa giao ${params.type === 'exam' ? 'bài kiểm tra' : 'bài ôn tập'}: "${params.title}" trong lớp ${newAssignment.className}. Hạn chót: ${params.dueDate}.`,
    type: 'assignment',
    link: '/app/classes',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('assignments_updated'));
  }
  return newAssignment;
};

// ==================== SUBMISSIONS (NỘP BÀI & BÁO CÁO GIÁO VIÊN) ====================

export const getSubmissions = (): StudentSubmission[] => {
  initClassStorage();
  try {
    const raw = localStorage.getItem(KEYS.SUBMISSIONS);
    return raw ? JSON.parse(raw) : initialSubmissions;
  } catch {
    return initialSubmissions;
  }
};

export const getSubmissionsByAssignment = (assignmentId: string): StudentSubmission[] => {
  return getSubmissions().filter((s) => s.assignmentId === assignmentId);
};

export const getSubmissionsByClass = (classId: string): StudentSubmission[] => {
  return getSubmissions().filter((s) => s.classId === classId);
};

export const recordStudentSubmission = (
  submission: Omit<StudentSubmission, 'id' | 'submittedAt'>
): StudentSubmission => {
  const submissions = getSubmissions();
  const assignments = getAssignments();

  const newSubmission: StudentSubmission = {
    ...submission,
    id: `sub-${Date.now()}`,
    submittedAt:
      new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' ' +
      new Date().toLocaleDateString('vi-VN'),
  };

  const updatedSubmissions = submissions.filter(
    (s) =>
      !(
        s.assignmentId === submission.assignmentId &&
        (s.studentId === submission.studentId || s.studentEmail === submission.studentEmail)
      )
  );
  updatedSubmissions.unshift(newSubmission);
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(updatedSubmissions));

  const asg = assignments.find((a) => a.id === submission.assignmentId);
  if (asg) {
    asg.submissionCount += 1;
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }

  const classroom = getClassroomById(submission.classId);
  const teacherId = classroom?.teacherId;
  const violationNotice =
    submission.tabSwitchCount > 0
      ? ` (⚠️ Đã vi phạm ${submission.tabSwitchCount} lần thoát màn hình thi!)`
      : ' (Tuân thủ tốt, 0 lần thoát tab)';

  addNotification({
    recipientRole: 'teacher',
    recipientUserId: teacherId,
    title:
      submission.status === 'violation_auto_submitted'
        ? '🚨 ĐÃ THU BÀI DO GIAN LẬN THI CỬ'
        : '✅ Học sinh vừa nộp bài kiểm tra',
    message: `Học sinh ${submission.studentName} (${submission.studentEmail}) vừa nộp bài "${asg?.title || 'Bài thi'}" trong lớp ${submission.className} - Đạt ${submission.score}% (${submission.correctCount}/${submission.totalQuestions} câu)${violationNotice}.`,
    type: submission.tabSwitchCount > 0 ? 'violation' : 'submission',
    link: `/app/classes?monitor=${submission.assignmentId}`,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('submissions_updated'));
  }
  return newSubmission;
};

export const recordStudentTabViolation = (params: {
  assignmentId: string;
  classId: string;
  studentName: string;
  studentEmail: string;
  violationCount: number;
  maxViolations: number;
  autoSubmitted?: boolean;
}): void => {
  const asg = getAssignmentById(params.assignmentId);
  const classroom = getClassroomById(params.classId);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const submissions = getSubmissions();
  let sub = submissions.find(
    (s) =>
      s.assignmentId === params.assignmentId &&
      (s.studentEmail === params.studentEmail || s.studentName === params.studentName)
  );

  if (sub) {
    sub.tabSwitchCount = params.violationCount;
    sub.lastViolationTime = timeStr;
    if (params.autoSubmitted) {
      sub.status = 'violation_auto_submitted';
      sub.submittedAt = `${timeStr} (Bị thu bài do gian lận)`;
    }
  } else {
    sub = {
      id: `sub-${Date.now()}`,
      assignmentId: params.assignmentId,
      classId: params.classId,
      className: classroom?.name || 'Lớp học',
      studentId: `std-${Date.now()}`,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      score: 0,
      correctCount: 0,
      totalQuestions: asg?.totalQuestions || 5,
      submittedAt: params.autoSubmitted ? `${timeStr} (Bị thu bài do gian lận)` : 'Đang làm bài...',
      durationSeconds: 300,
      tabSwitchCount: params.violationCount,
      lastViolationTime: timeStr,
      status: params.autoSubmitted ? 'violation_auto_submitted' : 'taking',
    };
    submissions.unshift(sub);
  }
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(submissions));

  addNotification({
    recipientRole: 'teacher',
    recipientUserId: classroom?.teacherId,
    title: params.autoSubmitted
      ? '🚨 THU BÀI DO GIAN LẬN: Quá số lần thoát tab!'
      : `⚠️ CẢNH BÁO: Học sinh thoát tab lần ${params.violationCount}/${params.maxViolations}`,
    message: `Học sinh ${params.studentName} (${params.studentEmail}) vừa rời khỏi màn hình làm bài lần thứ ${params.violationCount} trong bài thi "${asg?.title || 'Bài thi'}".${
      params.autoSubmitted ? ' Hệ thống đã tự động khóa bài thi và thu bài.' : ''
    }`,
    type: 'violation',
    link: `/app/classes?monitor=${params.assignmentId}`,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('exam_tab_violation_detected', {
        detail: {
          ...params,
          timestamp: timeStr,
        },
      })
    );
    window.dispatchEvent(new Event('submissions_updated'));
  }
};

export const simulateStudentTabViolation = (
  assignmentId: string
): { studentName: string; violationCount: number; autoSubmitted: boolean } | null => {
  const asg = getAssignmentById(assignmentId);
  if (!asg) return null;

  const submissions = getSubmissions();
  const candidates = submissions.filter((s) => s.assignmentId === assignmentId);
  const targetStudent = candidates.find((s) => s.status === 'taking') || candidates[0];

  const studentName = targetStudent ? targetStudent.studentName : 'Đỗ Hoàng Long';
  const studentEmail = targetStudent ? targetStudent.studentEmail : 'long.dh@uit.edu.vn';
  const currentViolations = targetStudent ? targetStudent.tabSwitchCount : 1;
  const nextViolations = currentViolations + 1;
  const maxAllowed = asg.maxTabSwitchViolations || 3;
  const autoSubmitted = nextViolations >= maxAllowed;

  recordStudentTabViolation({
    assignmentId: asg.id,
    classId: asg.classId,
    studentName,
    studentEmail,
    violationCount: nextViolations,
    maxViolations: maxAllowed,
    autoSubmitted,
  });

  return { studentName, violationCount: nextViolations, autoSubmitted };
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = (userRole?: UserRole): AppNotification[] => {
  initClassStorage();
  try {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    const list: AppNotification[] = raw ? JSON.parse(raw) : initialNotifications;
    if (!userRole) return list;
    return list.filter((n) => n.recipientRole === 'all' || n.recipientRole === userRole);
  } catch {
    return initialNotifications;
  }
};

export const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification => {
  const list = getNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    createdAt: 'Vừa xong',
    read: false,
  };
  list.unshift(newNotif);
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('notifications_updated'));
  }
  return newNotif;
};

export const markNotificationAsRead = (id: string): void => {
  const list = getNotifications();
  const found = list.find((n) => n.id === id);
  if (found) {
    found.read = true;
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications_updated'));
    }
  }
};

export const markAllNotificationsAsRead = (): void => {
  const list = getNotifications();
  list.forEach((n) => (n.read = true));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('notifications_updated'));
  }
};
