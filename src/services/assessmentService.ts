import type {
  Assessment,
  AssessmentAttempt,
  AssessmentQuestionSnapshot,
  AttemptAnswer,
  AssessmentType,
  AssessmentStatus,
  ShowResultPolicy,
  ApiResult,
} from '../types';
import { getCurrentUser, type UserProfile } from './auth';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';
import { getClassroomById, getClassrooms, addNotification } from './classService';
import { getAllQuestionsRaw } from './questionBankService';

export const ASSESSMENTS_KEY = 'd2p_assessments_v1';
export const ATTEMPTS_KEY = 'd2p_assessment_attempts_v1';

export interface AssessmentFilter {
  classId?: string;
  subjectId?: string;
  type?: AssessmentType | 'all';
  status?: AssessmentStatus | 'all';
  search?: string;
  schoolId?: string;
}

export interface CreateAssessmentParams {
  title: string;
  description?: string;
  type: AssessmentType;
  classId: string;
  subjectId?: string;
  durationMinutes: number; // 0 = không giới hạn
  availableFrom?: string; // ISO datetime
  availableUntil?: string; // ISO datetime
  maxScore?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultPolicy?: ShowResultPolicy;
  preventTabSwitch?: boolean;
  maxTabSwitchViolations?: number;
  questionIds?: string[];
  status?: AssessmentStatus;
}

export interface UpdateAssessmentParams {
  title?: string;
  description?: string;
  type?: AssessmentType;
  durationMinutes?: number;
  availableFrom?: string;
  availableUntil?: string;
  maxScore?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultPolicy?: ShowResultPolicy;
  preventTabSwitch?: boolean;
  maxTabSwitchViolations?: number;
  questionIds?: string[];
  status?: AssessmentStatus;
}

export interface GradeQuestionParams {
  attemptId: string;
  questionId: string;
  earnedPoints: number;
  feedback?: string;
}

/**
 * Đọc toàn bộ danh sách Assessments từ Storage
 */
export const getAllAssessmentsRaw = (): Assessment[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Lưu toàn bộ danh sách Assessments vào Storage
 */
export const saveAssessmentsRaw = (list: Assessment[]): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(list));
  }
};

/**
 * Đọc toàn bộ danh sách Attempts từ Storage
 */
export const getAllAttemptsRaw = (): AssessmentAttempt[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Lưu toàn bộ danh sách Attempts vào Storage
 */
export const saveAttemptsRaw = (list: AssessmentAttempt[]): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(list));
  }
};

/**
 * Thuật toán Fisher-Yates để xáo trộn mảng an toàn
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Khởi tạo dữ liệu mẫu ban đầu cho Đề kiểm tra và Bài làm
 */
export const initAssessmentStorage = (): void => {
  if (typeof localStorage === 'undefined') return;

  if (!localStorage.getItem(ASSESSMENTS_KEY)) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ngày sau
    const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const seedAssessments: Assessment[] = [
      {
        id: 'asm-001',
        title: 'Bài kiểm tra 30 phút: Khảo sát hàm số & Tích phân',
        description: 'Bài kiểm tra trực tuyến có giới hạn thời lượng, chống gian lận thoát tab, gồm 4 câu trắc nghiệm và tự luận.',
        type: 'exam',
        schoolId: 'school-lhp',
        classId: 'class-web-01',
        className: 'Lập trình Web & TypeScript (SE104.P12)',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        createdBy: 'usr-teacher-01',
        createdByName: 'ThS. Trần Thị Giáo Viên',
        durationMinutes: 30,
        availableFrom: pastDate.toISOString(),
        availableUntil: futureDate.toISOString(),
        maxScore: 10.0,
        status: 'published',
        shuffleQuestions: true,
        shuffleOptions: false,
        showResultPolicy: 'immediate',
        preventTabSwitch: true,
        maxTabSwitchViolations: 3,
        questionIds: ['qb-001', 'qb-002', 'qb-003', 'qb-004'],
        questionSnapshots: [
          {
            id: 'snp-01',
            originalQuestionId: 'qb-001',
            order: 1,
            content: 'Cho hàm số y = x^3 - 3x^2 + 2. Điểm cực đại của đồ thị hàm số là:',
            type: 'single_choice',
            options: ['(0; 2)', '(2; -2)', '(0; -2)', '(1; 0)'],
            correctAnswer: 0,
            explanation: 'Đạo hàm y\' = 3x^2 - 6x = 0 <=> x=0 hoặc x=2. Cực đại tại x=0, y=2.',
            points: 2.5,
          },
          {
            id: 'snp-02',
            originalQuestionId: 'qb-002',
            order: 2,
            content: 'Trong không gian Oxyz, những vectơ nào sau đây cùng phương với vectơ u = (2; -4; 6)?',
            type: 'multiple_choice',
            options: [
              'v1 = (1; -2; 3)',
              'v2 = (-1; 2; -3)',
              'v3 = (4; -8; 10)',
              'v4 = (-4; 8; -12)',
            ],
            correctAnswers: [0, 1, 3],
            explanation: 'Hai vectơ cùng phương khi v = k*u.',
            points: 2.5,
          },
          {
            id: 'snp-03',
            originalQuestionId: 'qb-003',
            order: 3,
            content: 'Hàm số f(x) = sin(x) là hàm số tuần hoàn với chu kỳ T = 2π.',
            type: 'true_false',
            options: ['Đúng', 'Sai'],
            correctAnswer: 0,
            explanation: 'Hàm sin(x) tuần hoàn với chu kỳ 2π.',
            points: 2.0,
          },
          {
            id: 'snp-04',
            originalQuestionId: 'qb-004',
            order: 4,
            content: 'Giải thích ý nghĩa hình học của đạo hàm tại một điểm và viết phương trình tiếp tuyến của đồ thị hàm số y = f(x) tại điểm M(x0; y0).',
            type: 'essay',
            sampleAnswer: '1. Hệ số góc k = f\'(x0).\n2. Phương trình tiếp tuyến: y - y0 = f\'(x0)*(x - x0).',
            rubric: '- Đúng hệ số góc: 1.5đ\n- Đúng phương trình: 1.5đ',
            explanation: 'Kiểm tra bản chất hình học của đạo hàm.',
            points: 3.0,
          },
        ],
        totalQuestions: 4,
        createdAt: pastDate.toISOString(),
        updatedAt: pastDate.toISOString(),
      },
      {
        id: 'asm-002',
        title: 'Bài tập tuần 5: Ôn tập Đại số & Giải tích',
        description: 'Bài tập về nhà tự luyện, không giới hạn thời gian làm bài.',
        type: 'assignment',
        schoolId: 'school-lhp',
        classId: 'class-web-01',
        className: 'Lập trình Web & TypeScript (SE104.P12)',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        createdBy: 'usr-teacher-01',
        createdByName: 'ThS. Trần Thị Giáo Viên',
        durationMinutes: 0,
        availableFrom: pastDate.toISOString(),
        availableUntil: futureDate.toISOString(),
        maxScore: 10.0,
        status: 'published',
        shuffleQuestions: false,
        shuffleOptions: false,
        showResultPolicy: 'immediate',
        preventTabSwitch: false,
        maxTabSwitchViolations: 0,
        questionIds: ['qb-001', 'qb-003'],
        questionSnapshots: [
          {
            id: 'snp-05',
            originalQuestionId: 'qb-001',
            order: 1,
            content: 'Cho hàm số y = x^3 - 3x^2 + 2. Điểm cực đại của đồ thị hàm số là:',
            type: 'single_choice',
            options: ['(0; 2)', '(2; -2)', '(0; -2)', '(1; 0)'],
            correctAnswer: 0,
            points: 5.0,
          },
          {
            id: 'snp-06',
            originalQuestionId: 'qb-003',
            order: 2,
            content: 'Hàm số f(x) = sin(x) là hàm số tuần hoàn với chu kỳ T = 2π.',
            type: 'true_false',
            options: ['Đúng', 'Sai'],
            correctAnswer: 0,
            points: 5.0,
          },
        ],
        totalQuestions: 2,
        createdAt: pastDate.toISOString(),
        updatedAt: pastDate.toISOString(),
      },
      {
        id: 'asm-003',
        title: 'Đề thi Khảo sát Giữa kỳ 1 (Bản nháp)',
        description: 'Đề thi dự thảo đang biên soạn, chưa xuất bản cho học sinh.',
        type: 'exam',
        schoolId: 'school-lhp',
        classId: 'class-web-01',
        className: 'Lập trình Web & TypeScript (SE104.P12)',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        createdBy: 'usr-teacher-01',
        createdByName: 'ThS. Trần Thị Giáo Viên',
        durationMinutes: 45,
        availableFrom: futureDate.toISOString(),
        availableUntil: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 10.0,
        status: 'draft',
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultPolicy: 'after_closed',
        preventTabSwitch: true,
        maxTabSwitchViolations: 3,
        questionIds: ['qb-001'],
        questionSnapshots: [],
        totalQuestions: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    saveAssessmentsRaw(seedAssessments);
  }

  if (!localStorage.getItem(ATTEMPTS_KEY)) {
    saveAttemptsRaw([]);
  }
};

// ==================== MODULE 1 & 2: QUẢN LÝ ĐỀ KIỂM TRA & GIAO BÀI TẬP ====================

/**
 * Lấy danh sách bài kiểm tra theo bộ lọc và vai trò người dùng (ABAC)
 */
export const getAssessments = (
  filter?: AssessmentFilter,
  userOverride?: UserProfile
): ApiResult<Assessment[]> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để truy cập đề kiểm tra.' },
    };
  }

  const allClasses = getClassrooms();
  let list = getAllAssessmentsRaw();

  // 1. Phân quyền theo vai trò (Multi-tenancy & Class Enrolment)
  if (user.role === 'student') {
    // Học sinh chỉ thấy bài của lớp mình đã tham gia VÀ đã xuất bản (không thấy draft)
    const myClasses = allClasses.filter((c) => c.studentIds?.includes(user.id));
    const myClassIds = myClasses.map((c) => c.id);

    list = list.filter(
      (a) => myClassIds.includes(a.classId) && (a.status === 'published' || a.status === 'closed')
    );
  } else if (user.role === 'teacher') {
    // Giáo viên thấy bài của các lớp mình phụ trách thuộc trường mình
    const myClasses = allClasses.filter(
      (c) => c.teacherId === user.id || c.secondaryTeacherIds?.includes(user.id)
    );
    const myClassIds = myClasses.map((c) => c.id);

    list = list.filter((a) => myClassIds.includes(a.classId) || a.createdBy === user.id);
  } else if (user.role === 'school_admin') {
    if (user.schoolId) {
      list = list.filter((a) => a.schoolId === user.schoolId);
    }
  }

  // 2. Lọc theo tiêu chí
  if (filter?.classId && filter.classId !== 'all') {
    list = list.filter((a) => a.classId === filter.classId);
  }

  if (filter?.subjectId && filter.subjectId !== 'all') {
    list = list.filter((a) => a.subjectId === filter.subjectId);
  }

  if (filter?.type && filter.type !== 'all') {
    list = list.filter((a) => a.type === filter.type);
  }

  if (filter?.status && filter.status !== 'all') {
    list = list.filter((a) => a.status === filter.status);
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.className.toLowerCase().includes(q)
    );
  }

  // Sắp xếp mới nhất
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { success: true, data: list };
};

/**
 * Lấy chi tiết đề kiểm tra có kiểm tra thẩm quyền
 */
export const getAssessmentById = (
  id: string,
  userOverride?: UserProfile
): ApiResult<Assessment> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const list = getAllAssessmentsRaw();
  const assessment = list.find((a) => a.id === id);

  if (!assessment) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Bài kiểm tra không tồn tại.' },
    };
  }

  const cls = getClassroomById(assessment.classId);

  // Thẩm định RBAC + ABAC
  const decision = checkPermission(user, 'assessment:read', {
    resourceSchoolId: assessment.schoolId,
    resourceTeacherId: cls?.teacherId,
    enrolledStudentIds: cls?.studentIds,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền truy cập bài kiểm tra này.',
      },
    };
  }

  // Nếu là học sinh và bài kiểm tra đang là nháp -> Chặn
  if (user.role === 'student' && assessment.status === 'draft') {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Bài kiểm tra đang ở chế độ bản nháp và chưa được giáo viên phát hành.',
      },
    };
  }

  return { success: true, data: assessment };
};

/**
 * Đóng băng snapshot danh sách câu hỏi từ Ngân hàng câu hỏi
 */
export const createQuestionSnapshots = (
  questionIds: string[],
  totalMaxScore: number = 10.0
): AssessmentQuestionSnapshot[] => {
  const allBankQuestions = getAllQuestionsRaw();
  const selectedQuestions = allBankQuestions.filter((q) => questionIds.includes(q.id));

  if (selectedQuestions.length === 0) return [];

  // Tính điểm mỗi câu (nếu chia đều)
  const defaultPointsPerQ = Number((totalMaxScore / selectedQuestions.length).toFixed(2));

  return selectedQuestions.map((q, idx) => ({
    id: `snp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    originalQuestionId: q.id,
    order: idx + 1,
    content: q.content,
    type: q.type,
    options: q.options ? [...q.options] : undefined,
    correctAnswer: q.correctAnswer,
    correctAnswers: q.correctAnswers ? [...q.correctAnswers] : undefined,
    sampleAnswer: q.sampleAnswer,
    rubric: q.rubric,
    explanation: q.explanation,
    points: q.defaultPoints && q.defaultPoints > 0 ? q.defaultPoints : defaultPointsPerQ,
  }));
};

/**
 * Giáo viên tạo đề kiểm tra hoặc bài tập mới
 */
export const createAssessment = (
  params: CreateAssessmentParams,
  userOverride?: UserProfile
): ApiResult<Assessment> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để tạo bài kiểm tra.' },
    };
  }

  const cls = getClassroomById(params.classId);
  if (!cls) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Lớp học được chọn không tồn tại.' },
    };
  }

  // Kiểm tra quyền giáo viên phụ trách lớp
  const decision = checkPermission(user, 'assessment:create', {
    resourceTeacherId: cls.teacherId,
    resourceSchoolId: cls.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền giao bài cho lớp học này.',
      },
    };
  }

  if (!params.title || !params.title.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Tiêu đề bài kiểm tra không được để trống.' },
    };
  }

  const maxScore = params.maxScore && params.maxScore > 0 ? params.maxScore : 10.0;
  const questionIds = params.questionIds || [];
  const status: AssessmentStatus = params.status || 'draft';

  // Nếu xuất bản ngay, bắt buộc phải có câu hỏi hợp lệ
  if (status === 'published' && questionIds.length === 0) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Không thể xuất bản bài kiểm tra khi chưa chọn câu hỏi nào từ ngân hàng.',
      },
    };
  }

  // Đóng băng snapshot câu hỏi nếu xuất bản
  const snapshots = status === 'published' ? createQuestionSnapshots(questionIds, maxScore) : [];

  const now = new Date();
  const availableFrom = params.availableFrom || now.toISOString();
  const availableUntil =
    params.availableUntil || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newAssessment: Assessment = {
    id: `asm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: params.title.trim(),
    description: (params.description || '').trim(),
    type: params.type || 'exam',
    schoolId: cls.schoolId,
    classId: cls.id,
    className: cls.name,
    subjectId: params.subjectId || cls.subjectId,
    subjectName: cls.subject,
    createdBy: user.id,
    createdByName: user.fullName,
    durationMinutes: params.durationMinutes !== undefined ? params.durationMinutes : 30,
    availableFrom,
    availableUntil,
    maxScore,
    status,
    shuffleQuestions: Boolean(params.shuffleQuestions),
    shuffleOptions: Boolean(params.shuffleOptions),
    showResultPolicy: params.showResultPolicy || 'immediate',
    preventTabSwitch: Boolean(params.preventTabSwitch),
    maxTabSwitchViolations: params.preventTabSwitch ? params.maxTabSwitchViolations || 3 : 0,
    questionIds,
    questionSnapshots: snapshots,
    totalQuestions: questionIds.length,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const list = getAllAssessmentsRaw();
  list.unshift(newAssessment);
  saveAssessmentsRaw(list);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSESSMENT_CREATED',
    targetType: 'assessment',
    targetId: newAssessment.id,
    schoolId: newAssessment.schoolId,
    details: `Tạo bài kiểm tra "${newAssessment.title}" cho lớp ${newAssessment.className} (${newAssessment.type}, trạng thái: ${newAssessment.status}).`,
    status: 'success',
  });

  if (status === 'published') {
    addNotification({
      recipientRole: 'student',
      title: newAssessment.type === 'exam' ? 'Bài kiểm tra mới' : 'Bài tập mới được giao',
      message: `Giáo viên vừa giao bài "${newAssessment.title}" trong lớp ${newAssessment.className}. Hạn chót: ${new Date(availableUntil).toLocaleDateString('vi-VN')}.`,
      type: 'assignment',
      link: `/app/classes?assignmentId=${newAssessment.id}`,
    });
  }

  return { success: true, data: newAssessment, message: 'Tạo bài kiểm tra thành công.' };
};

/**
 * Cập nhật thông tin bài kiểm tra
 */
export const updateAssessment = (
  id: string,
  updates: UpdateAssessmentParams,
  userOverride?: UserProfile
): ApiResult<Assessment> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const list = getAllAssessmentsRaw();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Bài kiểm tra không tồn tại.' },
    };
  }

  const existing = list[index];
  const cls = getClassroomById(existing.classId);

  const decision = checkPermission(user, 'assessment:update', {
    resourceTeacherId: cls?.teacherId,
    resourceSchoolId: existing.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền chỉnh sửa bài kiểm tra này.',
      },
    };
  }

  // Kiểm tra nếu đã có học sinh làm bài -> Không được sửa danh sách câu hỏi làm sai lệch bài thi
  const attempts = getAllAttemptsRaw().filter((att) => att.assessmentId === id);
  const hasStartedAttempts = attempts.length > 0;

  if (hasStartedAttempts && updates.questionIds !== undefined) {
    const isSameQuestions =
      updates.questionIds.length === existing.questionIds.length &&
      updates.questionIds.every((qid) => existing.questionIds.includes(qid));

    if (!isSameQuestions) {
      return {
        success: false,
        error: {
          code: 'FROZEN_ASSESSMENT',
          message: 'Không thể thay đổi danh sách câu hỏi vì đã có học sinh bắt đầu làm bài kiểm tra này.',
        },
      };
    }
  }

  // Cập nhật snapshot câu hỏi nếu có thay đổi và chưa có ai làm
  let snapshots = existing.questionSnapshots;
  if (!hasStartedAttempts && updates.questionIds !== undefined) {
    snapshots = createQuestionSnapshots(updates.questionIds, updates.maxScore || existing.maxScore);
  }

  const updated: Assessment = {
    ...existing,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    type: updates.type !== undefined ? updates.type : existing.type,
    durationMinutes: updates.durationMinutes !== undefined ? updates.durationMinutes : existing.durationMinutes,
    availableFrom: updates.availableFrom !== undefined ? updates.availableFrom : existing.availableFrom,
    availableUntil: updates.availableUntil !== undefined ? updates.availableUntil : existing.availableUntil,
    maxScore: updates.maxScore !== undefined ? updates.maxScore : existing.maxScore,
    shuffleQuestions: updates.shuffleQuestions !== undefined ? updates.shuffleQuestions : existing.shuffleQuestions,
    shuffleOptions: updates.shuffleOptions !== undefined ? updates.shuffleOptions : existing.shuffleOptions,
    showResultPolicy: updates.showResultPolicy !== undefined ? updates.showResultPolicy : existing.showResultPolicy,
    preventTabSwitch: updates.preventTabSwitch !== undefined ? updates.preventTabSwitch : existing.preventTabSwitch,
    maxTabSwitchViolations: updates.maxTabSwitchViolations !== undefined ? updates.maxTabSwitchViolations : existing.maxTabSwitchViolations,
    status: updates.status !== undefined ? updates.status : existing.status,
    questionIds: updates.questionIds !== undefined ? updates.questionIds : existing.questionIds,
    questionSnapshots: snapshots,
    totalQuestions: updates.questionIds !== undefined ? updates.questionIds.length : existing.totalQuestions,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  saveAssessmentsRaw(list);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSESSMENT_UPDATED',
    targetType: 'assessment',
    targetId: id,
    schoolId: existing.schoolId,
    details: `Cập nhật bài kiểm tra "${updated.title}".`,
    status: 'success',
  });

  return { success: true, data: updated, message: 'Cập nhật bài kiểm tra thành công.' };
};

/**
 * Xuất bản bài kiểm tra (Publish Assessment) - Đóng băng câu hỏi tại thời điểm này
 */
export const publishAssessment = (
  id: string,
  userOverride?: UserProfile
): ApiResult<Assessment> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const list = getAllAssessmentsRaw();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Bài kiểm tra không tồn tại.' },
    };
  }

  const assessment = list[index];
  const cls = getClassroomById(assessment.classId);

  const decision = checkPermission(user, 'assessment:publish', {
    resourceTeacherId: cls?.teacherId,
    resourceSchoolId: assessment.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền xuất bản bài kiểm tra này.',
      },
    };
  }

  if (!assessment.questionIds || assessment.questionIds.length === 0) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Không thể xuất bản bài kiểm tra khi chưa có câu hỏi nào.',
      },
    };
  }

  // Đóng băng toàn bộ nội dung câu hỏi
  const snapshots = createQuestionSnapshots(assessment.questionIds, assessment.maxScore);
  if (snapshots.length === 0) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Các câu hỏi được chọn không còn tồn tại trong ngân hàng câu hỏi.',
      },
    };
  }

  assessment.status = 'published';
  assessment.questionSnapshots = snapshots;
  assessment.totalQuestions = snapshots.length;
  assessment.updatedAt = new Date().toISOString();

  list[index] = assessment;
  saveAssessmentsRaw(list);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSESSMENT_PUBLISHED',
    targetType: 'assessment',
    targetId: assessment.id,
    schoolId: assessment.schoolId,
    details: `Xuất bản đề thi "${assessment.title}" cho lớp ${assessment.className} (${assessment.totalQuestions} câu hỏi đã đóng băng).`,
    status: 'success',
  });

  addNotification({
    recipientRole: 'student',
    title: assessment.type === 'exam' ? 'Bài kiểm tra trực tuyến mới' : 'Bài tập mới được giao',
    message: `Bài "${assessment.title}" đã được công bố cho lớp ${assessment.className}. Hạn chót: ${new Date(assessment.availableUntil).toLocaleDateString('vi-VN')}.`,
    type: 'assignment',
    link: `/app/classes?assignmentId=${assessment.id}`,
  });

  return { success: true, data: assessment, message: 'Xuất bản bài kiểm tra thành công.' };
};

/**
 * Đóng bài kiểm tra (Closed)
 */
export const closeAssessment = (
  id: string,
  userOverride?: UserProfile
): ApiResult<Assessment> => {
  return updateAssessment(id, { status: 'closed' }, userOverride);
};

/**
 * Xóa bài kiểm tra
 */
export const deleteAssessment = (
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

  const list = getAllAssessmentsRaw();
  const assessment = list.find((a) => a.id === id);
  if (!assessment) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Bài kiểm tra không tồn tại.' },
    };
  }

  const cls = getClassroomById(assessment.classId);
  const decision = checkPermission(user, 'assessment:delete', {
    resourceTeacherId: cls?.teacherId,
    resourceSchoolId: assessment.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền xóa bài kiểm tra này.',
      },
    };
  }

  const remaining = list.filter((a) => a.id !== id);
  saveAssessmentsRaw(remaining);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSESSMENT_DELETED',
    targetType: 'assessment',
    targetId: id,
    schoolId: assessment.schoolId,
    details: `Xóa bài kiểm tra "${assessment.title}".`,
    status: 'success',
  });

  return { success: true, data: { deleted: true }, message: 'Đã xóa bài kiểm tra.' };
};

// ==================== MODULE 3 & 4: HỌC SINH LÀM BÀI TRỰC TUYẾN & LƯỢT THI ====================

/**
 * Bắt đầu một lượt làm bài thi (Start Assessment Attempt)
 * - Kiểm tra thời điểm mở / đóng từ Backend Server Time
 * - Ngăn chặn duplicate attempts nếu đã nộp
 * - Khôi phục lượt làm bài đang dở dang (hỗ trợ reload / reconnect)
 * - Đảm bảo trả về dữ liệu câu hỏi đã SANITIZED (LOẠI BỎ đáp án và lời giải)
 */
export const startAssessmentAttempt = (
  assessmentId: string,
  userOverride?: UserProfile
): ApiResult<{
  attempt: AssessmentAttempt;
  questions: Array<Omit<AssessmentQuestionSnapshot, 'correctAnswer' | 'correctAnswers' | 'sampleAnswer' | 'rubric' | 'explanation'>>;
}> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để làm bài.' },
    };
  }

  const assessmentRes = getAssessmentById(assessmentId, user);
  if (!assessmentRes.success) {
    return { success: false, error: assessmentRes.error };
  }

  const assessment = assessmentRes.data;
  const cls = getClassroomById(assessment.classId);

  // 1. Kiểm tra học sinh thuộc lớp
  if (!cls?.studentIds?.includes(user.id)) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Bạn không phải là thành viên của lớp học được giao bài kiểm tra này.',
      },
    };
  }

  // 2. Kiểm tra trạng thái bài kiểm tra
  if (assessment.status !== 'published') {
    return {
      success: false,
      error: {
        code: 'ASSESSMENT_NOT_ACTIVE',
        message: 'Bài kiểm tra hiện không ở trạng thái sẵn sàng làm bài.',
      },
    };
  }

  const now = new Date();
  const serverTimeMs = now.getTime();
  const availableFromMs = new Date(assessment.availableFrom).getTime();
  const availableUntilMs = new Date(assessment.availableUntil).getTime();

  // 3. Kiểm tra thời gian mở đề (Không cho bắt đầu trước thời điểm mở)
  if (serverTimeMs < availableFromMs) {
    return {
      success: false,
      error: {
        code: 'NOT_OPEN_YET',
        message: `Chưa đến thời điểm mở bài kiểm tra. Bài sẽ mở lúc ${new Date(assessment.availableFrom).toLocaleString('vi-VN')}.`,
      },
    };
  }

  // 4. Kiểm tra thời gian đóng đề
  if (serverTimeMs > availableUntilMs) {
    return {
      success: false,
      error: {
        code: 'ASSESSMENT_CLOSED',
        message: `Bài kiểm tra đã đóng vào lúc ${new Date(assessment.availableUntil).toLocaleString('vi-VN')}.`,
      },
    };
  }

  // 5. Kiểm tra các lượt làm bài trước đó của học sinh
  const attempts = getAllAttemptsRaw();
  const studentAttempts = attempts.filter(
    (att) => att.assessmentId === assessmentId && att.studentId === user.id
  );

  // Nếu có lượt đang làm dở dang ('taking') -> Tiếp tục làm lượt đó
  const activeAttempt = studentAttempts.find((att) => att.status === 'taking');
  if (activeAttempt) {
    // Kiểm tra xem lượt làm dở dang này đã hết giờ chưa
    const deadlineMs = new Date(activeAttempt.deadlineAt).getTime();
    if (serverTimeMs > deadlineMs) {
      // Đã hết giờ -> Tự động thu bài
      activeAttempt.status = 'auto_submitted_expired';
      activeAttempt.submittedAt = now.toISOString();
      activeAttempt.updatedAt = now.toISOString();
      saveAttemptsRaw(attempts);

      return {
        success: false,
        error: {
          code: 'TIME_EXPIRED',
          message: 'Thời gian làm bài của bạn đã kết thúc. Bài thi đã được tự động nộp.',
        },
      };
    }

    const safeQuestions = sanitizeSnapshotsForStudent(
      assessment.questionSnapshots,
      assessment.shuffleQuestions,
      assessment.shuffleOptions
    );

    return {
      success: true,
      data: {
        attempt: activeAttempt,
        questions: safeQuestions,
      },
      message: 'Khôi phục phiên làm bài thành công.',
    };
  }

  // Nếu học sinh đã có lượt nộp bài hoàn tất -> Không cho làm lại (ngăn chặn duplicate attempts)
  const completedAttempt = studentAttempts.find(
    (att) =>
      att.status === 'submitted' ||
      att.status === 'graded' ||
      att.status === 'auto_submitted_expired' ||
      att.status === 'violation_auto_submitted'
  );

  if (completedAttempt) {
    return {
      success: false,
      error: {
        code: 'ALREADY_SUBMITTED',
        message: 'Bạn đã hoàn thành bài kiểm tra này và không được phép làm lại.',
      },
    };
  }

  // 6. Tính toán Deadline do Backend Server kiểm soát
  let deadlineAt: string;
  if (assessment.durationMinutes > 0) {
    const calculatedDeadlineMs = serverTimeMs + assessment.durationMinutes * 60 * 1000;
    // Hạn chót không được vượt quá thời điểm đóng đề (availableUntil)
    const effectiveDeadlineMs = Math.min(calculatedDeadlineMs, availableUntilMs);
    deadlineAt = new Date(effectiveDeadlineMs).toISOString();
  } else {
    deadlineAt = assessment.availableUntil;
  }

  // Tạo lượt thi mới
  const newAttempt: AssessmentAttempt = {
    id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    assessmentId: assessment.id,
    classId: assessment.classId,
    className: assessment.className,
    studentId: user.id,
    studentName: user.fullName,
    studentEmail: user.email,
    attemptNumber: studentAttempts.length + 1,
    startedAt: now.toISOString(),
    deadlineAt,
    status: 'taking',
    tabSwitchCount: 0,
    answers: {},
    score: 0,
    maxScore: assessment.maxScore,
    needsManualGrading: assessment.questionSnapshots.some((q) => q.type === 'essay'),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  attempts.unshift(newAttempt);
  saveAttemptsRaw(attempts);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSESSMENT_STARTED',
    targetType: 'attempt',
    targetId: newAttempt.id,
    schoolId: assessment.schoolId,
    details: `Học sinh ${user.fullName} bắt đầu làm bài kiểm tra "${assessment.title}". Thời lượng: ${assessment.durationMinutes} phút.`,
    status: 'success',
  });

  // Trả về câu hỏi an toàn (đã bóc tách đáp án)
  const safeQuestions = sanitizeSnapshotsForStudent(
    assessment.questionSnapshots,
    assessment.shuffleQuestions,
    assessment.shuffleOptions
  );

  return {
    success: true,
    data: {
      attempt: newAttempt,
      questions: safeQuestions,
    },
    message: 'Bắt đầu làm bài kiểm tra.',
  };
};

/**
 * Hàm loại bỏ toàn bộ đáp án, bài giải mẫu, rubric khi gửi câu hỏi thi cho học sinh
 */
function sanitizeSnapshotsForStudent(
  snapshots: AssessmentQuestionSnapshot[],
  shuffleQ: boolean = false,
  shuffleOpts: boolean = false
) {
  let list = snapshots.map((s) => {
    let opts = s.options ? [...s.options] : undefined;
    if (shuffleOpts && opts && s.type !== 'true_false') {
      opts = shuffleArray(opts);
    }

    return {
      id: s.id,
      originalQuestionId: s.originalQuestionId,
      order: s.order,
      content: s.content,
      type: s.type,
      options: opts,
      points: s.points,
    };
  });

  if (shuffleQ) {
    list = shuffleArray(list);
  }

  return list;
}

/**
 * Lưu câu trả lời định kỳ hoặc khi người dùng thay đổi đáp án (Auto-save)
 */
export const saveAttemptAnswers = (
  attemptId: string,
  answers: Record<string, { selectedAnswer?: number; selectedAnswers?: number[]; essayAnswer?: string }>,
  userOverride?: UserProfile
): ApiResult<{ saved: boolean; timestamp: string }> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const attempts = getAllAttemptsRaw();
  const attemptIndex = attempts.findIndex((att) => att.id === attemptId);
  if (attemptIndex === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Lượt làm bài không tồn tại.' },
    };
  }

  const attempt = attempts[attemptIndex];

  // Kiểm tra quyền sở hữu bài làm
  if (attempt.studentId !== user.id) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Bạn không có quyền sửa câu trả lời của thí sinh khác.' },
    };
  }

  if (attempt.status !== 'taking') {
    return {
      success: false,
      error: {
        code: 'ATTEMPT_CLOSED',
        message: 'Lượt làm bài này đã hoàn thành hoặc đã bị đóng, không thể cập nhật thêm câu trả lời.',
      },
    };
  }

  // Kiểm tra hạn chót backend (Grace period: 10 giây cho độ trễ mạng)
  const now = new Date();
  const deadlineMs = new Date(attempt.deadlineAt).getTime();
  if (now.getTime() > deadlineMs + 10000) {
    // Tự động thu bài do hết giờ
    submitAssessmentAttempt(attemptId, undefined, user);
    return {
      success: false,
      error: {
        code: 'TIME_EXPIRED',
        message: 'Thời gian làm bài đã kết thúc. Hệ thống đã tiến hành thu bài tự động.',
      },
    };
  }

  // Lấy snapshot đề thi để biết điểm tối đa mỗi câu
  const assessment = getAllAssessmentsRaw().find((a) => a.id === attempt.assessmentId);

  // Cập nhật câu trả lời
  const nowStr = now.toISOString();
  Object.keys(answers).forEach((qId) => {
    const ans = answers[qId];
    const snp = assessment?.questionSnapshots.find((s) => s.id === qId || s.originalQuestionId === qId);

    attempt.answers[qId] = {
      questionId: qId,
      type: snp?.type || 'single_choice',
      selectedAnswer: ans.selectedAnswer,
      selectedAnswers: ans.selectedAnswers,
      essayAnswer: ans.essayAnswer,
      maxPoints: snp?.points || 1.0,
      earnedPoints: 0,
      gradingStatus: 'pending',
      updatedAt: nowStr,
    };
  });

  attempt.updatedAt = nowStr;
  attempts[attemptIndex] = attempt;
  saveAttemptsRaw(attempts);

  return {
    success: true,
    data: { saved: true, timestamp: nowStr },
    message: 'Tự động lưu câu trả lời thành công.',
  };
};

// ==================== MODULE 5: TỰ ĐỘNG CHẤM ĐIỂM VÀ NỘP BÀI ====================

/**
 * Nộp bài kiểm tra & Thực hiện tự động chấm điểm tại Backend
 * - Đảm bảo Idempotency (Gửi lặp nhiều lần không bị duplicate hay tính lại điểm sai lệch)
 * - Tự động chấm Trắc nghiệm đơn, nhiều đáp án, đúng/sai
 * - Đánh dấu câu tự luận chờ giáo viên chấm
 */
export const submitAssessmentAttempt = (
  attemptId: string,
  finalAnswers?: Record<string, { selectedAnswer?: number; selectedAnswers?: number[]; essayAnswer?: string }>,
  userOverride?: UserProfile
): ApiResult<AssessmentAttempt> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const attempts = getAllAttemptsRaw();
  const attemptIndex = attempts.findIndex((att) => att.id === attemptId);
  if (attemptIndex === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Lượt làm bài không tồn tại.' },
    };
  }

  const attempt = attempts[attemptIndex];

  // 1. Kiểm tra quyền nộp bài
  if (user.role === 'student' && attempt.studentId !== user.id) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Bạn không có quyền nộp bài của học sinh khác.' },
    };
  }

  // 2. Tính lũy đẳng (Idempotency): Nếu bài đã nộp trước đó -> Trả về kết quả hiện tại
  if (attempt.status !== 'taking') {
    return {
      success: true,
      data: attempt,
      message: 'Bài thi đã được ghi nhận nộp thành công trước đó.',
    };
  }

  // Lấy đề thi và danh sách snapshot câu hỏi
  const assessment = getAllAssessmentsRaw().find((a) => a.id === attempt.assessmentId);
  if (!assessment) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Đề thi gốc không tồn tại.' },
    };
  }

  // Gộp câu trả lời cuối cùng nếu có
  const now = new Date();
  const nowStr = now.toISOString();

  if (finalAnswers) {
    Object.keys(finalAnswers).forEach((qId) => {
      const ans = finalAnswers[qId];
      const snp = assessment.questionSnapshots.find((s) => s.id === qId || s.originalQuestionId === qId);

      attempt.answers[qId] = {
        questionId: qId,
        type: snp?.type || 'single_choice',
        selectedAnswer: ans.selectedAnswer,
        selectedAnswers: ans.selectedAnswers,
        essayAnswer: ans.essayAnswer,
        maxPoints: snp?.points || 1.0,
        earnedPoints: 0,
        gradingStatus: 'pending',
        updatedAt: nowStr,
      };
    });
  }

  // 3. TỰ ĐỘNG CHẤM ĐIỂM (Auto-Grading Rules)
  let totalScore = 0;
  let hasPendingEssay = false;

  for (const snp of assessment.questionSnapshots) {
    const qKey = snp.id;
    const studentAns = attempt.answers[qKey] || attempt.answers[snp.originalQuestionId];

    if (!studentAns) {
      // Bỏ trống câu hỏi -> 0 điểm
      attempt.answers[qKey] = {
        questionId: qKey,
        type: snp.type,
        maxPoints: snp.points,
        earnedPoints: 0,
        gradingStatus: 'auto_graded',
        updatedAt: nowStr,
      };
      continue;
    }

    studentAns.maxPoints = snp.points;

    // Chấm Single Choice
    if (snp.type === 'single_choice') {
      if (
        studentAns.selectedAnswer !== undefined &&
        snp.correctAnswer !== undefined &&
        studentAns.selectedAnswer === snp.correctAnswer
      ) {
        studentAns.earnedPoints = snp.points;
      } else {
        studentAns.earnedPoints = 0;
      }
      studentAns.gradingStatus = 'auto_graded';
      totalScore += studentAns.earnedPoints;
    }
    // Chấm Multiple Choice (Yêu cầu trùng khớp chính xác tập đáp án đúng)
    else if (snp.type === 'multiple_choice') {
      const selected = (studentAns.selectedAnswers || []).slice().sort((a, b) => a - b);
      const correct = (snp.correctAnswers || []).slice().sort((a, b) => a - b);

      const isMatch =
        selected.length === correct.length &&
        selected.every((val, i) => val === correct[i]);

      if (isMatch && selected.length > 0) {
        studentAns.earnedPoints = snp.points;
      } else {
        studentAns.earnedPoints = 0;
      }
      studentAns.gradingStatus = 'auto_graded';
      totalScore += studentAns.earnedPoints;
    }
    // Chấm True / False
    else if (snp.type === 'true_false') {
      if (
        studentAns.selectedAnswer !== undefined &&
        snp.correctAnswer !== undefined &&
        studentAns.selectedAnswer === snp.correctAnswer
      ) {
        studentAns.earnedPoints = snp.points;
      } else {
        studentAns.earnedPoints = 0;
      }
      studentAns.gradingStatus = 'auto_graded';
      totalScore += studentAns.earnedPoints;
    }
    // Câu hỏi Tự luận (Essay) -> Đưa vào hàng đợi chờ giáo viên chấm
    else if (snp.type === 'essay') {
      studentAns.earnedPoints = 0;
      studentAns.gradingStatus = 'pending';
      hasPendingEssay = true;
    }
  }

  // Làm tròn điểm 2 chữ số thập phân, không vượt quá maxScore
  totalScore = Math.min(assessment.maxScore, Math.round(totalScore * 100) / 100);

  attempt.score = totalScore;
  attempt.maxScore = assessment.maxScore;
  attempt.needsManualGrading = hasPendingEssay;
  attempt.status = hasPendingEssay ? 'submitted' : 'graded';
  attempt.submittedAt = nowStr;
  attempt.updatedAt = nowStr;

  attempts[attemptIndex] = attempt;
  saveAttemptsRaw(attempts);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSESSMENT_SUBMITTED',
    targetType: 'attempt',
    targetId: attempt.id,
    schoolId: assessment.schoolId,
    details: `Học sinh ${attempt.studentName} nộp bài "${assessment.title}". Điểm tự động: ${totalScore}/${assessment.maxScore}${hasPendingEssay ? ' (Có câu tự luận chờ giáo viên chấm)' : ''}.`,
    status: 'success',
  });

  return {
    success: true,
    data: attempt,
    message: hasPendingEssay
      ? 'Đã nộp bài thành công. Câu hỏi tự luận sẽ được giáo viên chấm và phản hồi sớm.'
      : `Đã nộp bài thành công! Bạn đạt ${totalScore}/${assessment.maxScore} điểm.`,
  };
};

/**
 * Tự động thu bài khi hết thời gian thi (do timer / backend kiểm tra)
 */
export const handleExpiredAttempt = (attemptId: string): ApiResult<AssessmentAttempt> => {
  const attempts = getAllAttemptsRaw();
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Lượt thi không tồn tại.' } };
  }

  if (attempt.status !== 'taking') {
    return { success: true, data: attempt };
  }

  // Thu bài và đánh dấu hết giờ
  const res = submitAssessmentAttempt(attemptId);
  if (res.success) {
    const updatedAttempts = getAllAttemptsRaw();
    const idx = updatedAttempts.findIndex((a) => a.id === attemptId);
    if (idx !== -1) {
      updatedAttempts[idx].status = 'auto_submitted_expired';
      saveAttemptsRaw(updatedAttempts);
      res.data.status = 'auto_submitted_expired';
    }
  }
  return res;
};

// ==================== MODULE 6: GIÁO VIÊN CHẤM TỰ LUẬN & QUẢN LÝ KẾT QUẢ ====================

/**
 * Lấy danh sách bài nộp của bài kiểm tra cho Giáo viên
 */
export const getAssessmentAttemptsForTeacher = (
  assessmentId: string,
  userOverride?: UserProfile
): ApiResult<AssessmentAttempt[]> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const assessment = getAllAssessmentsRaw().find((a) => a.id === assessmentId);
  if (!assessment) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Bài kiểm tra không tồn tại.' },
    };
  }

  const cls = getClassroomById(assessment.classId);
  const decision = checkPermission(user, 'assessment:grade', {
    resourceTeacherId: cls?.teacherId,
    resourceSchoolId: assessment.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền xem bảng điểm của bài kiểm tra này.',
      },
    };
  }

  const attempts = getAllAttemptsRaw().filter((att) => att.assessmentId === assessmentId);
  return { success: true, data: attempts };
};

/**
 * Giáo viên chấm điểm và nhập nhận xét cho câu hỏi tự luận
 */
export const gradeEssayQuestion = (
  params: GradeQuestionParams,
  userOverride?: UserProfile
): ApiResult<AssessmentAttempt> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const attempts = getAllAttemptsRaw();
  const attemptIndex = attempts.findIndex((att) => att.id === params.attemptId);
  if (attemptIndex === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Lượt làm bài không tồn tại.' },
    };
  }

  const attempt = attempts[attemptIndex];
  const assessment = getAllAssessmentsRaw().find((a) => a.id === attempt.assessmentId);
  if (!assessment) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Đề thi không tồn tại.' },
    };
  }

  const cls = getClassroomById(assessment.classId);
  const decision = checkPermission(user, 'assessment:grade', {
    resourceTeacherId: cls?.teacherId,
    resourceSchoolId: assessment.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền chấm bài kiểm tra này.',
      },
    };
  }

  const ans = attempt.answers[params.questionId];
  if (!ans) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Câu trả lời không tồn tại trong bài làm.' },
    };
  }

  if (ans.type !== 'essay') {
    return {
      success: false,
      error: { code: 'INVALID_TYPE', message: 'Chỉ câu hỏi tự luận mới hỗ trợ chấm thủ công.' },
    };
  }

  // Kiểm tra điểm số hợp lệ (0 <= earnedPoints <= maxPoints)
  if (params.earnedPoints < 0 || params.earnedPoints > ans.maxPoints) {
    return {
      success: false,
      error: {
        code: 'INVALID_SCORE',
        message: `Điểm chấm (${params.earnedPoints}) phải nằm trong khoảng từ 0 đến ${ans.maxPoints}.`,
      },
    };
  }

  const prevPoints = ans.earnedPoints;
  ans.earnedPoints = Number(params.earnedPoints);
  ans.teacherFeedback = params.feedback ? params.feedback.trim() : undefined;
  ans.gradingStatus = 'manually_graded';
  ans.updatedAt = new Date().toISOString();

  // Tính lại tổng điểm
  let newTotal = 0;
  let remainingPending = false;

  Object.values(attempt.answers).forEach((a) => {
    newTotal += a.earnedPoints || 0;
    if (a.gradingStatus === 'pending') {
      remainingPending = true;
    }
  });

  newTotal = Math.min(attempt.maxScore, Math.round(newTotal * 100) / 100);

  attempt.score = newTotal;
  attempt.needsManualGrading = remainingPending;
  attempt.status = remainingPending ? 'submitted' : 'graded';
  attempt.gradedAt = new Date().toISOString();
  attempt.gradedBy = user.fullName;
  attempt.updatedAt = new Date().toISOString();

  attempts[attemptIndex] = attempt;
  saveAttemptsRaw(attempts);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ASSESSMENT_GRADED',
    targetType: 'attempt',
    targetId: attempt.id,
    schoolId: assessment.schoolId,
    details: `Giáo viên ${user.fullName} chấm câu tự luận cho học sinh ${attempt.studentName}: ${ans.earnedPoints}/${ans.maxPoints} điểm (trước đó: ${prevPoints}đ). Tổng điểm mới: ${newTotal}/${attempt.maxScore}.`,
    status: 'success',
  });

  return {
    success: true,
    data: attempt,
    message: `Đã chấm câu tự luận (${ans.earnedPoints}/${ans.maxPoints}đ).`,
  };
};

// ==================== MODULE 7: HỌC SINH XEM KẾT QUẢ THEO CHÍNH SÁCH ====================

/**
 * Học sinh xem kết quả bài làm của mình có bảo vệ chính sách đáp án (Policy-Enforced)
 */
export const getStudentAttemptResult = (
  attemptId: string,
  userOverride?: UserProfile
): ApiResult<{
  attempt: AssessmentAttempt;
  assessmentTitle: string;
  maxScore: number;
  canViewAnswersAndExplanations: boolean;
  questionDetails?: Array<{
    id: string;
    content: string;
    type: string;
    options?: string[];
    correctAnswer?: number;
    correctAnswers?: number[];
    sampleAnswer?: string;
    rubric?: string;
    explanation?: string;
    points: number;
    studentAnswer: AttemptAnswer;
  }>;
}> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const attempts = getAllAttemptsRaw();
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Lượt làm bài không tồn tại.' },
    };
  }

  // Học sinh chỉ được xem bài của chính mình
  if (user.role === 'student' && attempt.studentId !== user.id) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Bạn không có quyền xem kết quả bài làm của học sinh khác.' },
    };
  }

  const assessment = getAllAssessmentsRaw().find((a) => a.id === attempt.assessmentId);
  if (!assessment) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Đề thi không tồn tại.' },
    };
  }

  // Đánh giá chính sách công bố đáp án (showResultPolicy)
  let canViewAnswersAndExplanations = false;
  const now = new Date();
  const isClosed = assessment.status === 'closed' || now.getTime() > new Date(assessment.availableUntil).getTime();

  if (assessment.showResultPolicy === 'immediate') {
    canViewAnswersAndExplanations = true;
  } else if (assessment.showResultPolicy === 'after_closed') {
    canViewAnswersAndExplanations = isClosed;
  } else if (assessment.showResultPolicy === 'manual') {
    canViewAnswersAndExplanations = isClosed && attempt.status === 'graded';
  }

  // Ghép chi tiết câu hỏi và câu trả lời
  const questionDetails = assessment.questionSnapshots.map((snp) => {
    const studentAnswer = attempt.answers[snp.id] ||
      attempt.answers[snp.originalQuestionId] || {
        questionId: snp.id,
        type: snp.type,
        maxPoints: snp.points,
        earnedPoints: 0,
        gradingStatus: 'auto_graded' as const,
        updatedAt: attempt.submittedAt || '',
      };

    return {
      id: snp.id,
      content: snp.content,
      type: snp.type,
      options: snp.options,
      correctAnswer: canViewAnswersAndExplanations ? snp.correctAnswer : undefined,
      correctAnswers: canViewAnswersAndExplanations ? snp.correctAnswers : undefined,
      sampleAnswer: canViewAnswersAndExplanations ? snp.sampleAnswer : undefined,
      rubric: canViewAnswersAndExplanations ? snp.rubric : undefined,
      explanation: canViewAnswersAndExplanations ? snp.explanation : undefined,
      points: snp.points,
      studentAnswer,
    };
  });

  return {
    success: true,
    data: {
      attempt,
      assessmentTitle: assessment.title,
      maxScore: assessment.maxScore,
      canViewAnswersAndExplanations,
      questionDetails,
    },
  };
};
