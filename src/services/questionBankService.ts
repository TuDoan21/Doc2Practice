import type {
  BankQuestion,
  SanitizedStudentQuestion,
  QuestionType,
  QuestionScope,
  QuestionStatus,
  DifficultyLevel,
  ApiResult,
} from '../types';
import { getCurrentUser, type UserProfile } from './auth';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';

export const QUESTION_BANK_KEY = 'd2p_question_bank_v1';

export interface QuestionFilter {
  subjectId?: string;
  gradeLevel?: string;
  topic?: string;
  type?: QuestionType | 'all';
  difficulty?: DifficultyLevel | 'all';
  scope?: QuestionScope | 'all';
  status?: QuestionStatus | 'all';
  search?: string;
  schoolId?: string;
}

export interface CreateQuestionParams {
  content: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number;
  correctAnswers?: number[];
  sampleAnswer?: string;
  rubric?: string;
  explanation?: string;
  subjectId?: string;
  subjectName?: string;
  gradeLevel?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  defaultPoints?: number;
  scope?: QuestionScope;
  status?: QuestionStatus;
  schoolId?: string;
}

export interface UpdateQuestionParams {
  content?: string;
  type?: QuestionType;
  options?: string[];
  correctAnswer?: number;
  correctAnswers?: number[];
  sampleAnswer?: string;
  rubric?: string;
  explanation?: string;
  subjectId?: string;
  subjectName?: string;
  gradeLevel?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  defaultPoints?: number;
  scope?: QuestionScope;
  status?: QuestionStatus;
}

export interface ImportValidationIssue {
  row: number;
  field?: string;
  reason: string;
}

export interface ImportResult {
  total: number;
  validCount: number;
  errorCount: number;
  errors: ImportValidationIssue[];
  previewQuestions: BankQuestion[];
  savedQuestions?: BankQuestion[];
}

/**
 * Lọc bỏ thông tin đáp án, bài giải mẫu và thang điểm khi gửi câu hỏi cho học sinh
 */
export const sanitizeQuestionForStudent = (
  question: BankQuestion
): SanitizedStudentQuestion => {
  const {
    correctAnswer: _ca,
    correctAnswers: _cas,
    sampleAnswer: _sa,
    rubric: _rb,
    explanation: _exp,
    ...safeQuestion
  } = question;
  return safeQuestion;
};

/**
 * Thẩm định tính hợp lệ của câu hỏi theo từng loại (Validation rules)
 */
export const validateQuestionData = (
  params: Partial<CreateQuestionParams>
): { valid: boolean; error?: string } => {
  // 1. Kiểm tra nội dung câu hỏi
  if (!params.content || !params.content.trim()) {
    return { valid: false, error: 'Nội dung câu hỏi không được để trống.' };
  }

  // 2. Điểm số mặc định
  if (params.defaultPoints !== undefined && params.defaultPoints <= 0) {
    return { valid: false, error: 'Điểm số của câu hỏi phải lớn hơn 0.' };
  }

  const type = params.type || 'single_choice';

  // 3. Quy tắc riêng cho Single Choice (Trắc nghiệm 1 đáp án đúng)
  if (type === 'single_choice') {
    if (!params.options || !Array.isArray(params.options) || params.options.length < 2) {
      return {
        valid: false,
        error: 'Câu hỏi trắc nghiệm một đáp án yêu cầu tối thiểu 2 phương án lựa chọn.',
      };
    }

    // Kiểm tra các phương án không được rỗng
    for (let i = 0; i < params.options.length; i++) {
      if (!params.options[i] || !params.options[i].trim()) {
        return { valid: false, error: `Phương án thứ ${i + 1} không được để trống.` };
      }
    }

    if (params.correctAnswer === undefined || params.correctAnswer === null) {
      return { valid: false, error: 'Vui lòng chọn một đáp án đúng cho câu hỏi.' };
    }

    if (
      typeof params.correctAnswer !== 'number' ||
      params.correctAnswer < 0 ||
      params.correctAnswer >= params.options.length
    ) {
      return {
        valid: false,
        error: `Đáp án đúng không hợp lệ (phải nằm trong khoảng từ 1 đến ${params.options.length}).`,
      };
    }

    // Chặn trường hợp truyền nhầm nhiều đáp án đúng
    if (params.correctAnswers && params.correctAnswers.length > 1) {
      return {
        valid: false,
        error: 'Câu hỏi trắc nghiệm đơn không được phép có nhiều hơn một đáp án đúng.',
      };
    }
  }

  // 4. Quy tắc cho Multiple Choice (Trắc nghiệm nhiều đáp án đúng)
  if (type === 'multiple_choice') {
    if (!params.options || !Array.isArray(params.options) || params.options.length < 2) {
      return {
        valid: false,
        error: 'Câu hỏi trắc nghiệm nhiều đáp án yêu cầu tối thiểu 2 phương án lựa chọn.',
      };
    }

    for (let i = 0; i < params.options.length; i++) {
      if (!params.options[i] || !params.options[i].trim()) {
        return { valid: false, error: `Phương án thứ ${i + 1} không được để trống.` };
      }
    }

    if (
      !params.correctAnswers ||
      !Array.isArray(params.correctAnswers) ||
      params.correctAnswers.length === 0
    ) {
      return {
        valid: false,
        error: 'Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi trắc nghiệm nhiều lựa chọn.',
      };
    }

    for (const ansIdx of params.correctAnswers) {
      if (
        typeof ansIdx !== 'number' ||
        ansIdx < 0 ||
        ansIdx >= params.options.length
      ) {
        return {
          valid: false,
          error: `Chỉ số đáp án đúng (${ansIdx}) không nằm trong danh sách phương án lựa chọn.`,
        };
      }
    }
  }

  // 5. Quy tắc cho True/False (Đúng / Sai)
  if (type === 'true_false') {
    const opts = params.options && params.options.length === 2 ? params.options : ['Đúng', 'Sai'];
    if (opts.length !== 2) {
      return { valid: false, error: 'Câu hỏi Đúng / Sai bắt buộc có đúng 2 lựa chọn.' };
    }

    if (params.correctAnswer === undefined || (params.correctAnswer !== 0 && params.correctAnswer !== 1)) {
      return { valid: false, error: 'Vui lòng xác định đáp án Đúng (1) hoặc Sai (0).' };
    }
  }

  // 6. Quy tắc cho Essay (Tự luận)
  if (type === 'essay') {
    // Không bắt buộc options hay correctAnswer
  }

  return { valid: true };
};

/**
 * Đọc toàn bộ câu hỏi từ Storage
 */
export const getAllQuestionsRaw = (): BankQuestion[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Lưu toàn bộ câu hỏi vào Storage
 */
const saveQuestionsRaw = (list: BankQuestion[]): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(list));
  }
};

/**
 * Khởi tạo dữ liệu câu hỏi mẫu ban đầu (Đầy đủ 4 dạng câu hỏi)
 */
export const initQuestionBankStorage = (): void => {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(QUESTION_BANK_KEY)) {
    const seedQuestions: BankQuestion[] = [
      {
        id: 'qb-001',
        content: 'Cho hàm số y = x^3 - 3x^2 + 2. Điểm cực đại của đồ thị hàm số là:',
        type: 'single_choice',
        options: ['(0; 2)', '(2; -2)', '(0; -2)', '(1; 0)'],
        correctAnswer: 0,
        explanation: 'Ta có y\' = 3x^2 - 6x = 0 <=> x = 0 hoặc x = 2. Đạo hàm đổi dấu từ dương sang âm qua x = 0 nên x = 0 là điểm cực đại, y(0) = 2.',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        gradeLevel: 'Khối 12',
        topic: 'Khảo sát hàm số',
        difficulty: 'medium',
        defaultPoints: 1.0,
        createdBy: 'usr-teacher-01',
        createdByName: 'ThS. Trần Thị Giáo Viên',
        schoolId: 'school-lhp',
        scope: 'school_shared',
        status: 'active',
        createdAt: '2026-09-08T08:00:00Z',
        updatedAt: '2026-09-08T08:00:00Z',
      },
      {
        id: 'qb-002',
        content: 'Trong không gian Oxyz, những vectơ nào sau đây cùng phương với vectơ u = (2; -4; 6)?',
        type: 'multiple_choice',
        options: [
          'v1 = (1; -2; 3)',
          'v2 = (-1; 2; -3)',
          'v3 = (4; -8; 10)',
          'v4 = (-4; 8; -12)',
        ],
        correctAnswers: [0, 1, 3],
        explanation: 'Hai vectơ cùng phương khi tồn tại số thực k sao cho v = k*u. Ta thấy v1 ứng với k=1/2, v2 ứng với k=-1/2, v4 ứng với k=-2.',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        gradeLevel: 'Khối 12',
        topic: 'Hình học Oxyz',
        difficulty: 'medium',
        defaultPoints: 1.5,
        createdBy: 'usr-teacher-01',
        createdByName: 'ThS. Trần Thị Giáo Viên',
        schoolId: 'school-lhp',
        scope: 'personal',
        status: 'active',
        createdAt: '2026-09-15T09:30:00Z',
        updatedAt: '2026-09-15T09:30:00Z',
      },
      {
        id: 'qb-003',
        content: 'Hàm số f(x) = sin(x) là hàm số tuần hoàn với chu kỳ T = 2π.',
        type: 'true_false',
        options: ['Đúng', 'Sai'],
        correctAnswer: 0,
        explanation: 'Hàm số sin(x) tuần hoàn với chu kỳ cơ bản T = 2π vì sin(x + 2π) = sin(x) với mọi x.',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        gradeLevel: 'Khối 11',
        topic: 'Lượng giác',
        difficulty: 'easy',
        defaultPoints: 0.5,
        createdBy: 'usr-teacher-01',
        createdByName: 'ThS. Trần Thị Giáo Viên',
        schoolId: 'school-lhp',
        scope: 'global_shared',
        status: 'active',
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
      },
      {
        id: 'qb-004',
        content: 'Giải thích ý nghĩa hình học của đạo hàm tại một điểm và viết phương trình tiếp tuyến của đồ thị hàm số y = f(x) tại điểm M(x0; y0).',
        type: 'essay',
        sampleAnswer: '1. Ý nghĩa hình học: Đạo hàm của hàm số y = f(x) tại điểm x0 là hệ số góc k của tiếp tuyến của đồ thị hàm số tại điểm M(x0; f(x0)).\n2. Phương trình tiếp tuyến: y - y0 = f\'(x0) * (x - x0).',
        rubric: '- Nêu đúng định nghĩa hệ số góc tiếp tuyến k = f\'(x0): 1.0 điểm\n- Viết đúng công thức phương trình tiếp tuyến: 1.0 điểm',
        explanation: 'Kiểm tra mức độ hiểu bản chất hình học của đạo hàm và khả năng viết tiếp tuyến.',
        subjectId: 'sub-toan-12',
        subjectName: 'Toán học 12',
        gradeLevel: 'Khối 11',
        topic: 'Đạo hàm & Tiếp tuyến',
        difficulty: 'medium',
        defaultPoints: 2.0,
        createdBy: 'usr-teacher-01',
        createdByName: 'ThS. Trần Thị Giáo Viên',
        schoolId: 'school-lhp',
        scope: 'school_shared',
        status: 'active',
        createdAt: '2026-09-22T14:00:00Z',
        updatedAt: '2026-09-22T14:00:00Z',
      },
      {
        id: 'qb-005',
        content: 'Một vật chuyển động thẳng biến đổi đều với gia tốc a = 2 m/s^2 từ trạng thái nghỉ. Vận tốc của vật sau 5 giây là:',
        type: 'single_choice',
        options: ['10 m/s', '20 m/s', '5 m/s', '25 m/s'],
        correctAnswer: 0,
        explanation: 'Áp dụng công thức: v = v0 + a*t = 0 + 2 * 5 = 10 m/s.',
        subjectId: 'sub-ly-10',
        subjectName: 'Vật lý 10',
        gradeLevel: 'Khối 10',
        topic: 'Chuyển động biến đổi đều',
        difficulty: 'easy',
        defaultPoints: 1.0,
        createdBy: 'usr-teacher-kl',
        createdByName: 'Thầy Nguyễn Kim Liên',
        schoolId: 'school-kl',
        scope: 'personal',
        status: 'active',
        createdAt: '2026-09-15T11:00:00Z',
        updatedAt: '2026-09-15T11:00:00Z',
      },
    ];

    saveQuestionsRaw(seedQuestions);
  }
};

/**
 * Lấy danh sách câu hỏi theo bộ lọc và quyền hạn (RBAC + ABAC)
 */
export const getQuestions = (
  filter?: QuestionFilter,
  userOverride?: UserProfile,
  isStudentContext: boolean = false
): ApiResult<Array<BankQuestion | SanitizedStudentQuestion>> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  let list = getAllQuestionsRaw();

  // 1. Phân quyền truy cập theo vai trò
  if (user.role === 'student' || isStudentContext) {
    // Học sinh chỉ xem câu hỏi đang hoạt động và bắt buộc sanitize
    list = list.filter((q) => q.status === 'active');
    const sanitized = list.map(sanitizeQuestionForStudent);
    return { success: true, data: sanitized };
  }

  if (user.role === 'teacher') {
    // Giáo viên chỉ thấy:
    // a. Câu hỏi của chính mình
    // b. Câu hỏi chia sẻ trong cùng trường (school_shared)
    // c. Câu hỏi chia sẻ toàn quốc (global_shared)
    list = list.filter((q) => {
      if (q.createdBy === user.id) return true;
      if (q.scope === 'global_shared') return true;
      if (q.scope === 'school_shared' && user.schoolId && q.schoolId === user.schoolId) {
        return true;
      }
      return false;
    });
  } else if (user.role === 'school_admin') {
    // School Admin thấy câu hỏi của trường mình + global_shared
    if (user.schoolId) {
      list = list.filter((q) => q.schoolId === user.schoolId || q.scope === 'global_shared');
    }
  }
  // System Admin thấy toàn bộ

  // 2. Lọc theo tiêu chí
  if (filter?.subjectId && filter.subjectId !== 'all') {
    list = list.filter((q) => q.subjectId === filter.subjectId);
  }

  if (filter?.gradeLevel && filter.gradeLevel !== 'all') {
    list = list.filter((q) => q.gradeLevel === filter.gradeLevel);
  }

  if (filter?.topic && filter.topic !== 'all') {
    list = list.filter((q) => q.topic && q.topic.toLowerCase().includes(filter.topic!.toLowerCase()));
  }

  if (filter?.type && filter.type !== 'all') {
    list = list.filter((q) => q.type === filter.type);
  }

  if (filter?.difficulty && filter.difficulty !== 'all') {
    list = list.filter((q) => q.difficulty === filter.difficulty);
  }

  if (filter?.scope && filter.scope !== 'all') {
    list = list.filter((q) => q.scope === filter.scope);
  }

  if (filter?.status && filter.status !== 'all') {
    list = list.filter((q) => q.status === filter.status);
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.content.toLowerCase().includes(q) ||
        (item.topic && item.topic.toLowerCase().includes(q)) ||
        (item.options && item.options.some((o) => o.toLowerCase().includes(q))) ||
        (item.sampleAnswer && item.sampleAnswer.toLowerCase().includes(q))
    );
  }

  // Sắp xếp mới nhất
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { success: true, data: list };
};

/**
 * Lấy chi tiết câu hỏi theo ID
 */
export const getQuestionById = (
  id: string,
  userOverride?: UserProfile,
  isStudentContext: boolean = false
): ApiResult<BankQuestion | SanitizedStudentQuestion> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const list = getAllQuestionsRaw();
  const q = list.find((item) => item.id === id);

  if (!q) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Câu hỏi không tồn tại.' },
    };
  }

  // Kiểm tra quyền truy cập
  const decision = checkPermission(user, 'question:read', {
    resourceSchoolId: q.schoolId,
    resourceOwnerId: q.createdBy,
    resourceScope: q.scope,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền xem câu hỏi này.',
      },
    };
  }

  // Nếu là học sinh, bắt buộc che đáp án
  if (user.role === 'student' || isStudentContext) {
    return { success: true, data: sanitizeQuestionForStudent(q) };
  }

  return { success: true, data: q };
};

/**
 * Tạo câu hỏi mới trong ngân hàng
 */
export const createQuestion = (
  params: CreateQuestionParams,
  userOverride?: UserProfile
): ApiResult<BankQuestion> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để tạo câu hỏi.' },
    };
  }

  // Thẩm định quyền tạo câu hỏi
  const decision = checkPermission(user, 'question:create', {
    targetSchoolId: params.schoolId || user.schoolId,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền tạo câu hỏi trong ngân hàng.',
      },
    };
  }

  // Validation
  const validation = validateQuestionData(params);
  if (!validation.valid) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: validation.error || 'Dữ liệu không hợp lệ.' },
    };
  }

  const type = params.type || 'single_choice';
  let defaultOptions: string[] | undefined = params.options;
  if (type === 'true_false' && (!defaultOptions || defaultOptions.length === 0)) {
    defaultOptions = ['Đúng', 'Sai'];
  }

  const now = new Date().toISOString();
  const newQuestion: BankQuestion = {
    id: `qb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    content: params.content.trim(),
    type,
    options: defaultOptions,
    correctAnswer: params.correctAnswer,
    correctAnswers: params.correctAnswers,
    sampleAnswer: params.sampleAnswer ? params.sampleAnswer.trim() : undefined,
    rubric: params.rubric ? params.rubric.trim() : undefined,
    explanation: params.explanation ? params.explanation.trim() : undefined,
    subjectId: params.subjectId,
    subjectName: params.subjectName,
    gradeLevel: params.gradeLevel,
    topic: params.topic ? params.topic.trim() : undefined,
    difficulty: params.difficulty || 'medium',
    defaultPoints: params.defaultPoints !== undefined ? Number(params.defaultPoints) : 1.0,
    createdBy: user.id,
    createdByName: user.fullName,
    schoolId: user.schoolId || params.schoolId || 'school-lhp',
    scope: params.scope || 'personal',
    status: params.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  const list = getAllQuestionsRaw();
  list.unshift(newQuestion);
  saveQuestionsRaw(list);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'QUESTION_CREATED',
    targetType: 'question',
    targetId: newQuestion.id,
    schoolId: newQuestion.schoolId,
    details: `Tạo câu hỏi [${newQuestion.type}] trong ngân hàng: "${newQuestion.content.slice(0, 50)}...".`,
    status: 'success',
  });

  return { success: true, data: newQuestion, message: 'Tạo câu hỏi thành công.' };
};

/**
 * Cập nhật thông tin câu hỏi
 */
export const updateQuestion = (
  id: string,
  updates: UpdateQuestionParams,
  userOverride?: UserProfile
): ApiResult<BankQuestion> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const list = getAllQuestionsRaw();
  const index = list.findIndex((q) => q.id === id);
  if (index === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Câu hỏi không tồn tại.' },
    };
  }

  const existing = list[index];

  // Thẩm định quyền sửa
  const decision = checkPermission(user, 'question:update', {
    resourceSchoolId: existing.schoolId,
    resourceOwnerId: existing.createdBy,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền chỉnh sửa câu hỏi này.',
      },
    };
  }

  // Kết hợp dữ liệu cập nhật để validate
  const merged: CreateQuestionParams = {
    content: updates.content !== undefined ? updates.content : existing.content,
    type: updates.type !== undefined ? updates.type : existing.type,
    options: updates.options !== undefined ? updates.options : existing.options,
    correctAnswer: updates.correctAnswer !== undefined ? updates.correctAnswer : existing.correctAnswer,
    correctAnswers: updates.correctAnswers !== undefined ? updates.correctAnswers : existing.correctAnswers,
    sampleAnswer: updates.sampleAnswer !== undefined ? updates.sampleAnswer : existing.sampleAnswer,
    rubric: updates.rubric !== undefined ? updates.rubric : existing.rubric,
    explanation: updates.explanation !== undefined ? updates.explanation : existing.explanation,
    subjectId: updates.subjectId !== undefined ? updates.subjectId : existing.subjectId,
    subjectName: updates.subjectName !== undefined ? updates.subjectName : existing.subjectName,
    gradeLevel: updates.gradeLevel !== undefined ? updates.gradeLevel : existing.gradeLevel,
    topic: updates.topic !== undefined ? updates.topic : existing.topic,
    difficulty: updates.difficulty !== undefined ? updates.difficulty : existing.difficulty,
    defaultPoints: updates.defaultPoints !== undefined ? updates.defaultPoints : existing.defaultPoints,
    scope: updates.scope !== undefined ? updates.scope : existing.scope,
    status: updates.status !== undefined ? updates.status : existing.status,
  };

  const validation = validateQuestionData(merged);
  if (!validation.valid) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: validation.error || 'Dữ liệu không hợp lệ.' },
    };
  }

  const updated: BankQuestion = {
    ...existing,
    content: merged.content.trim(),
    type: merged.type,
    options: merged.options,
    correctAnswer: merged.correctAnswer,
    correctAnswers: merged.correctAnswers,
    sampleAnswer: merged.sampleAnswer ? merged.sampleAnswer.trim() : undefined,
    rubric: merged.rubric ? merged.rubric.trim() : undefined,
    explanation: merged.explanation ? merged.explanation.trim() : undefined,
    subjectId: merged.subjectId,
    subjectName: merged.subjectName,
    gradeLevel: merged.gradeLevel,
    topic: merged.topic ? merged.topic.trim() : undefined,
    difficulty: merged.difficulty || 'medium',
    defaultPoints: merged.defaultPoints || 1.0,
    scope: merged.scope || 'personal',
    status: merged.status || 'active',
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  saveQuestionsRaw(list);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'QUESTION_UPDATED',
    targetType: 'question',
    targetId: id,
    schoolId: existing.schoolId,
    details: `Cập nhật câu hỏi ID ${id}.`,
    status: 'success',
  });

  return { success: true, data: updated, message: 'Cập nhật câu hỏi thành công.' };
};

/**
 * Nhân bản câu hỏi vào kho cá nhân của giáo viên (Clone Question)
 */
export const cloneQuestion = (
  id: string,
  userOverride?: UserProfile
): ApiResult<BankQuestion> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const list = getAllQuestionsRaw();
  const source = list.find((q) => q.id === id);
  if (!source) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Câu hỏi nguồn không tồn tại.' },
    };
  }

  // Kiểm tra quyền xem câu hỏi nguồn
  const decision = checkPermission(user, 'question:read', {
    resourceSchoolId: source.schoolId,
    resourceOwnerId: source.createdBy,
    resourceScope: source.scope,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: 'Bạn không có quyền truy cập để nhân bản câu hỏi này.',
      },
    };
  }

  const now = new Date().toISOString();
  const cloned: BankQuestion = {
    ...source,
    id: `qb-clone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    content: `${source.content} (Bản sao)`,
    createdBy: user.id,
    createdByName: user.fullName,
    schoolId: user.schoolId || source.schoolId,
    scope: 'personal', // Mặc định về kho cá nhân
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(cloned);
  saveQuestionsRaw(list);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'QUESTION_CLONED',
    targetType: 'question',
    targetId: cloned.id,
    schoolId: cloned.schoolId,
    details: `Nhân bản câu hỏi từ ${source.id} vào kho cá nhân.`,
    status: 'success',
  });

  return { success: true, data: cloned, message: 'Nhân bản câu hỏi thành công.' };
};

/**
 * Lưu trữ câu hỏi (archive)
 */
export const archiveQuestion = (
  id: string,
  userOverride?: UserProfile
): ApiResult<BankQuestion> => {
  return updateQuestion(id, { status: 'archived' }, userOverride);
};

/**
 * Xóa câu hỏi khỏi ngân hàng
 */
export const deleteQuestion = (
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

  const list = getAllQuestionsRaw();
  const q = list.find((item) => item.id === id);
  if (!q) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Câu hỏi không tồn tại.' },
    };
  }

  const decision = checkPermission(user, 'question:delete', {
    resourceSchoolId: q.schoolId,
    resourceOwnerId: q.createdBy,
  });

  if (!decision.allowed) {
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền xóa câu hỏi này.',
      },
    };
  }

  const remaining = list.filter((item) => item.id !== id);
  saveQuestionsRaw(remaining);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'QUESTION_DELETED',
    targetType: 'question',
    targetId: id,
    schoolId: q.schoolId,
    details: `Xóa câu hỏi ID ${id}.`,
    status: 'success',
  });

  return { success: true, data: { deleted: true }, message: 'Đã xóa câu hỏi khỏi ngân hàng.' };
};

/**
 * Phân tích và nhập danh sách câu hỏi hàng loạt từ cấu trúc dữ liệu (CSV rows / JSON objects)
 */
export const importQuestionsFromData = (
  rawRows: any[],
  defaults?: {
    subjectId?: string;
    subjectName?: string;
    gradeLevel?: string;
    scope?: QuestionScope;
  },
  saveToStorage: boolean = false,
  userOverride?: UserProfile
): ImportResult => {
  const user = userOverride || getCurrentUser();
  const errors: ImportValidationIssue[] = [];
  const previewQuestions: BankQuestion[] = [];
  const now = new Date().toISOString();

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      total: 0,
      validCount: 0,
      errorCount: 1,
      errors: [{ row: 1, reason: 'Tệp rỗng hoặc không chứa dữ liệu câu hỏi.' }],
      previewQuestions: [],
    };
  }

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 1;

    // Chuẩn hóa tên trường (hỗ trợ cả tiếng Anh và tiếng Việt từ CSV)
    const content = (row.content || row.question || row['Nội dung'] || row['Cau hoi'] || '').toString().trim();
    const rawTypeStr = (row.type || row['Loại câu hỏi'] || row.questionType || 'single_choice')
      .toString()
      .trim()
      .toLowerCase();

    let type: QuestionType = 'single_choice';

    // Map các alias thường gặp
    if (rawTypeStr.includes('single') || rawTypeStr.includes('đơn') || rawTypeStr === 'mcq') type = 'single_choice';
    else if (rawTypeStr.includes('multiple') || rawTypeStr.includes('nhiều') || rawTypeStr === 'multi') type = 'multiple_choice';
    else if (rawTypeStr.includes('true') || rawTypeStr.includes('đúng') || rawTypeStr === 'tf') type = 'true_false';
    else if (rawTypeStr.includes('essay') || rawTypeStr.includes('tự luận') || rawTypeStr === 'writing') type = 'essay';
    else type = 'single_choice';

    // Parse options
    let options: string[] | undefined;
    if (row.options && Array.isArray(row.options)) {
      options = row.options.map((o: any) => String(o).trim());
    } else if (typeof row.options === 'string') {
      options = row.options.split('|').map((o: string) => o.trim());
    } else if (row['Lựa chọn']) {
      options = String(row['Lựa chọn']).split('|').map((o: string) => o.trim());
    } else if (row.A || row['Phương án A']) {
      // Dạng cột riêng A, B, C, D
      options = [
        String(row.A || row['Phương án A'] || '').trim(),
        String(row.B || row['Phương án B'] || '').trim(),
        String(row.C || row['Phương án C'] || '').trim(),
        String(row.D || row['Phương án D'] || '').trim(),
      ].filter(Boolean);
    }

    // Parse correct answer(s)
    let correctAnswer: number | undefined;
    let correctAnswers: number[] | undefined;

    const rawCorrect = row.correctAnswer ?? row['Đáp án đúng'] ?? row.answer ?? row.correctAnswers;

    if (type === 'single_choice' || type === 'true_false') {
      if (typeof rawCorrect === 'number') {
        correctAnswer = rawCorrect;
      } else if (typeof rawCorrect === 'string') {
        const val = rawCorrect.trim().toUpperCase();
        if (val === 'A' || val === '1') correctAnswer = 0;
        else if (val === 'B' || val === '2') correctAnswer = 1;
        else if (val === 'C' || val === '3') correctAnswer = 2;
        else if (val === 'D' || val === '4') correctAnswer = 3;
        else if (val === 'ĐÚNG' || val === 'TRUE') correctAnswer = 0;
        else if (val === 'SAI' || val === 'FALSE') correctAnswer = 1;
        else {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) correctAnswer = parsed;
        }
      }
    } else if (type === 'multiple_choice') {
      if (Array.isArray(rawCorrect)) {
        correctAnswers = rawCorrect.map(Number);
      } else if (typeof rawCorrect === 'string') {
        const parts = rawCorrect.split(/[,;|]/).map((p: string) => p.trim().toUpperCase());
        correctAnswers = parts.map((p: string) => {
          if (p === 'A' || p === '1') return 0;
          if (p === 'B' || p === '2') return 1;
          if (p === 'C' || p === '3') return 2;
          if (p === 'D' || p === '4') return 3;
          return parseInt(p, 10);
        }).filter((num: number) => !isNaN(num));
      }
    }

    const candidate: Partial<CreateQuestionParams> = {
      content,
      type,
      options,
      correctAnswer,
      correctAnswers,
      sampleAnswer: (row.sampleAnswer || row['Bài giải mẫu'] || '').toString(),
      rubric: (row.rubric || row['Tiêu chí chấm'] || '').toString(),
      explanation: (row.explanation || row['Giải thích'] || '').toString(),
      defaultPoints: row.defaultPoints || row['Điểm'] ? Number(row.defaultPoints || row['Điểm']) : 1.0,
      difficulty: (row.difficulty || row['Mức độ'] || 'medium').toLowerCase(),
    };

    const validation = validateQuestionData(candidate);
    if (!validation.valid) {
      errors.push({
        row: rowNum,
        reason: validation.error || 'Dữ liệu câu hỏi không hợp lệ.',
      });
      return;
    }

    // Câu hỏi hợp lệ
    const validQuestion: BankQuestion = {
      id: `qb-imp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      content,
      type,
      options: type === 'true_false' && (!options || options.length === 0) ? ['Đúng', 'Sai'] : options,
      correctAnswer,
      correctAnswers,
      sampleAnswer: candidate.sampleAnswer ? candidate.sampleAnswer.trim() : undefined,
      rubric: candidate.rubric ? candidate.rubric.trim() : undefined,
      explanation: candidate.explanation ? candidate.explanation.trim() : undefined,
      subjectId: row.subjectId || defaults?.subjectId,
      subjectName: row.subjectName || defaults?.subjectName,
      gradeLevel: row.gradeLevel || defaults?.gradeLevel,
      topic: (row.topic || row['Chủ đề'] || '').toString().trim() || undefined,
      difficulty: (row.difficulty as DifficultyLevel) || 'medium',
      defaultPoints: candidate.defaultPoints || 1.0,
      createdBy: user?.id || 'usr-teacher-01',
      createdByName: user?.fullName || 'Giáo viên',
      schoolId: user?.schoolId || 'school-lhp',
      scope: defaults?.scope || 'personal',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    previewQuestions.push(validQuestion);
  });

  // Nếu cờ saveToStorage là true và có câu hỏi hợp lệ -> lưu vào Storage
  let savedQuestions: BankQuestion[] | undefined;
  if (saveToStorage && previewQuestions.length > 0) {
    const existingList = getAllQuestionsRaw();
    const updatedList = [...previewQuestions, ...existingList];
    saveQuestionsRaw(updatedList);
    savedQuestions = previewQuestions;

    if (user) {
      recordAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'QUESTION_IMPORTED',
        targetType: 'question',
        schoolId: user.schoolId,
        details: `Nhập thành công ${previewQuestions.length} câu hỏi vào ngân hàng (${errors.length} dòng lỗi bị bỏ qua).`,
        status: 'success',
      });
    }
  }

  return {
    total: rawRows.length,
    validCount: previewQuestions.length,
    errorCount: errors.length,
    errors,
    previewQuestions,
    savedQuestions,
  };
};
