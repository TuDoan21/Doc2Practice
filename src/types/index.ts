export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0, 1, 2, 3
  explanation: string;
}

export interface QuizSet {
  id: string;
  title: string;
  description: string;
  sourceDocumentName: string;
  sourceDocumentSize: string;
  questionCount: number;
  difficulty: DifficultyLevel;
  createdAt: string;
  lastScore?: number | null; // e.g. 80 (%)
  lastAttemptAt?: string;
  category: string;
  questions: Question[];
}

export interface Flashcard {
  id: string;
  front: string; // Câu hỏi / thuật ngữ
  back: string; // Định nghĩa / câu trả lời chi tiết
  example?: string;
  status: 'new' | 'learning' | 'mastered';
}

export interface FlashcardDeck {
  id: string;
  title: string;
  sourceDocumentName: string;
  cards: Flashcard[];
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  pageCount: number;
  quizSetsGenerated: number;
  status: 'ready' | 'processing';
}

export interface QuizAttempt {
  id: string;
  quizSetId: string;
  quizTitle: string;
  score: number; // Điểm thang 10 hoặc phần trăm
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
  durationSeconds: number;
  answers: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }[];
}

export interface UserStats {
  totalDocuments: number;
  totalQuizSets: number;
  totalQuestionsAnswered: number;
  averageScore: number;
  studyStreakDays: number;
}

// ==================== HỌC SINH - GIÁO VIÊN - QUẢN TRỊ TRƯỜNG HỌC ====================

export type UserRole = 'student' | 'teacher' | 'school_admin' | 'system_admin';

export interface School {
  id: string;
  code: string;
  name: string;
  level: 'high_school' | 'secondary_school' | 'university' | 'college';
  address: string;
  phone: string;
  email: string;
  description?: string;
  teacherCount?: number;
  studentCount?: number;
  classCount?: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  schoolId?: string; // ID trường nếu là môn riêng, hoặc undefined/'global' nếu dùng chung toàn hệ thống
  subjectCode: string;
  name: string;
  description?: string;
  gradeLevel?: string; // Khối 10, Khối 11, Khối 12, Đại học...
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherApprovalRequest {
  id: string;
  fullName: string;
  email: string;
  schoolName: string;
  schoolId?: string;
  department: string; // Tổ chuyên môn (VD: Toán - Tin, Ngữ Văn, Tiếng Anh...)
  teacherCode: string;
  proofDocumentName?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  notes?: string;
}

export interface ClassMaterial {
  id: string;
  classId: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'text';
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
}

// ==================== TÀI LIỆU HỌC TẬP TRƯỜNG HỌC (LEARNING MATERIALS) ====================

export type MaterialFileType = 'pdf' | 'docx' | 'pptx' | 'txt' | 'image';
export type MaterialStatus = 'draft' | 'published' | 'archived';

export interface LearningMaterial {
  id: string;
  title: string;
  description: string;
  originalFileName: string;
  storageKey: string; // Khóa định danh file an toàn trong Blob Storage, không lộ file path
  contentType: string; // MIME type: e.g. 'application/pdf'
  fileSize: number; // bytes
  fileSizeFormatted: string; // e.g. "2.4 MB"
  fileType: MaterialFileType;
  uploadedBy: string; // User ID
  uploadedByName: string;
  schoolId: string; // ID trường sở hữu
  subjectId?: string; // ID môn học liên kết
  subjectName?: string;
  topic?: string; // Chuyên đề / bài giảng
  status: MaterialStatus; // draft | published | archived
  sharedClassIds: string[]; // Danh sách lớp được giao quyền xem tài liệu
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== NGÂN HÀNG CÂU HỎI TRƯỜNG HỌC (QUESTION BANK) ====================

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';
export type QuestionScope = 'personal' | 'school_shared' | 'global_shared';
export type QuestionStatus = 'draft' | 'active' | 'archived';

export interface BankQuestion {
  id: string;
  content: string; // Nội dung câu hỏi
  type: QuestionType; // Loại câu hỏi
  options?: string[]; // Danh sách các lựa chọn (single_choice, multiple_choice, true_false)
  correctAnswer?: number; // Index đáp án đúng (single_choice, true_false)
  correctAnswers?: number[]; // Mảng các index đáp án đúng (multiple_choice)
  sampleAnswer?: string; // Đáp án mẫu / Gợi ý làm bài (tự luận essay)
  rubric?: string; // Tiêu chí chấm điểm và thang điểm (tự luận essay)
  explanation?: string; // Lời giải thích chi tiết
  subjectId?: string;
  subjectName?: string;
  gradeLevel?: string; // Khối 10, Khối 11, Khối 12, Đại học...
  topic?: string; // Chuyên đề / bài học
  difficulty: DifficultyLevel; // easy | medium | hard
  defaultPoints: number; // Điểm số mặc định
  createdBy: string; // User ID giáo viên tạo
  createdByName: string;
  schoolId: string; // ID trường sở hữu
  scope: QuestionScope; // personal | school_shared | global_shared
  status: QuestionStatus; // draft | active | archived
  createdAt: string;
  updatedAt: string;
}

/**
 * Phiên bản câu hỏi an toàn gửi cho học sinh làm bài:
 * Tuyệt đối LOẠI BỎ correctAnswer, correctAnswers, sampleAnswer, rubric, explanation
 */
export type SanitizedStudentQuestion = Omit<
  BankQuestion,
  'correctAnswer' | 'correctAnswers' | 'sampleAnswer' | 'rubric' | 'explanation'
>;

export interface Classroom {
  id: string;
  code: string; // Mã tham gia 6 ký tự, ví dụ: "WEB-8821"
  name: string;
  subject: string;
  subjectId?: string;
  schoolId: string; // ID trường quản lý lớp
  grade?: string; // Khối 10, Khối 11, Khối 12, ĐH...
  gradeLevel?: string;
  academicYear?: string; // 2026-2027
  semester?: string; // Học kỳ 1, Học kỳ 2, Cả năm
  status?: 'active' | 'archived'; // Hoạt động hoặc Lưu trữ/Đóng lớp
  teacherId: string;
  teacherName: string;
  secondaryTeacherIds?: string[];
  description: string;
  studentCount: number;
  studentIds: string[];
  joinCodeActive?: boolean; // Cho phép tham gia bằng mã
  documentCount?: number;
  materials?: ClassMaterial[];
  createdAt: string;
  updatedAt?: string;
}

export interface ClassJoinRequest {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
}

export type AssignmentType = 'practice' | 'exam';

// ==================== HỆ THỐNG ĐỀ KIỂM TRA & BÀI TẬP TOÀN DIỆN (ASSESSMENTS & EXAMS) ====================

export type AssessmentType = 'assignment' | 'exam';
export type AssessmentStatus = 'draft' | 'published' | 'closed' | 'archived';
export type ShowResultPolicy = 'immediate' | 'after_closed' | 'manual';

export interface AssessmentQuestionSnapshot {
  id: string; // Snapshot ID
  originalQuestionId: string;
  order: number;
  content: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number;
  correctAnswers?: number[];
  sampleAnswer?: string;
  rubric?: string;
  explanation?: string;
  points: number; // Điểm số cho câu hỏi trong bài thi
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: AssessmentType; // 'assignment' (bài tập) hoặc 'exam' (bài thi thời lượng)
  schoolId: string;
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  createdBy: string;
  createdByName: string;
  durationMinutes: number; // 0 nếu không giới hạn thời gian làm
  availableFrom: string; // ISO datetime bắt đầu cho phép làm bài
  availableUntil: string; // ISO datetime hạn chót đóng bài
  maxScore: number; // Tổng điểm tối đa (ví dụ 10 hoặc 100)
  status: AssessmentStatus; // draft | published | closed | archived
  shuffleQuestions: boolean; // Trộn câu hỏi
  shuffleOptions: boolean; // Trộn các phương án A/B/C/D
  showResultPolicy: ShowResultPolicy; // Chính sách công bố kết quả
  preventTabSwitch: boolean; // Khóa chuyển tab chống gian lận
  maxTabSwitchViolations: number;
  questionIds: string[]; // ID câu hỏi trong ngân hàng
  questionSnapshots: AssessmentQuestionSnapshot[]; // Snapshot đóng băng câu hỏi tại lúc xuất bản
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export type AttemptStatus =
  | 'taking'
  | 'submitted'
  | 'auto_submitted_expired'
  | 'violation_auto_submitted'
  | 'graded';

export interface AttemptAnswer {
  questionId: string;
  type: QuestionType;
  selectedAnswer?: number; // single_choice, true_false
  selectedAnswers?: number[]; // multiple_choice
  essayAnswer?: string; // essay
  maxPoints: number;
  earnedPoints: number;
  gradingStatus: 'pending' | 'auto_graded' | 'manually_graded';
  teacherFeedback?: string;
  updatedAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  attemptNumber: number;
  startedAt: string;
  deadlineAt: string; // Hạn chót do backend kiểm soát: startedAt + duration
  submittedAt?: string;
  status: AttemptStatus;
  tabSwitchCount: number;
  answers: Record<string, AttemptAnswer>; // Map questionId -> AttemptAnswer
  score: number; // Tổng điểm đạt được
  maxScore: number;
  needsManualGrading: boolean; // True nếu có câu tự luận chưa chấm
  gradedAt?: string;
  gradedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassAssignment {
  id: string;
  classId: string;
  className: string;
  title: string;
  quizSetId: string;
  type: AssignmentType; // 'practice' (bài ôn) hoặc 'exam' (bài kiểm tra chống chuyển tab)
  durationMinutes: number; // e.g. 15, 30, 45, 60
  preventTabSwitch: boolean; // Khóa chuyển tab
  maxTabSwitchViolations: number; // Tối đa số lần chuyển tab trước khi cảnh báo / thu bài
  dueDate: string;
  createdAt: string;
  totalQuestions: number;
  submissionCount: number;
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number; // 0 - 100
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  durationSeconds: number;
  tabSwitchCount: number; // Số lần vi phạm chuyển tab
  status: 'taking' | 'submitted' | 'violation_auto_submitted';
  lastViolationTime?: string;
}

export interface AppNotification {
  id: string;
  recipientRole: 'all' | 'teacher' | 'student' | 'school_admin' | 'system_admin';
  recipientUserId?: string;
  title: string;
  message: string;
  type: 'submission' | 'assignment' | 'violation' | 'approval' | 'info';
  createdAt: string;
  read: boolean;
  link?: string;
}

// ==================== SECURITY & RBAC MODELS ====================

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  school?: string;
  department?: string;
  studentCode?: string;
  teacherCode?: string;
  avatarColor: string;
  passwordHash: string;
  passwordSalt: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  status: 'active' | 'pending_approval' | 'locked';
  createdAt: string;
  updatedAt?: string;
}

export interface Session {
  token: string;
  userId: string;
  userRole: UserRole;
  schoolId?: string;
  issuedAt: string;
  expiresAt: string;
  lastActiveAt: string;
  userAgent?: string;
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole | 'anonymous';
  action:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'ACCOUNT_LOCKED'
    | 'LOGOUT'
    | 'REGISTER_STUDENT'
    | 'REGISTER_TEACHER_PENDING'
    | 'TEACHER_APPROVED'
    | 'TEACHER_REJECTED'
    | 'PASSWORD_RESET_REQUESTED'
    | 'PASSWORD_RESET_COMPLETED'
    | 'PROFILE_UPDATED'
    | 'UNAUTHORIZED_ACCESS_BLOCKED'
    | 'ROLE_ESCALATION_BLOCKED'
    | 'CROSS_SCHOOL_ACCESS_BLOCKED'
    | 'SCHOOL_CREATED'
    | 'SCHOOL_UPDATED'
    | 'SCHOOL_STATUS_CHANGED'
    | 'SUBJECT_CREATED'
    | 'SUBJECT_UPDATED'
    | 'SUBJECT_STATUS_CHANGED'
    | 'CLASSROOM_CREATED'
    | 'CLASSROOM_UPDATED'
    | 'CLASS_ARCHIVED'
    | 'CLASS_TEACHER_ASSIGNED'
    | 'CLASS_JOIN_REQUESTED'
    | 'CLASS_JOIN_APPROVED'
    | 'CLASS_JOIN_REJECTED'
    | 'CLASS_STUDENT_REMOVED'
    | 'CLASS_STUDENT_LEFT'
    | 'CLASS_CODE_REGENERATED'
    | 'ASSIGNMENT_CREATED'
    | 'MATERIAL_UPLOADED'
    | 'MATERIAL_UPDATED'
    | 'MATERIAL_ARCHIVED'
    | 'MATERIAL_DELETED'
    | 'MATERIAL_SHARED'
    | 'MATERIAL_DOWNLOADED'
    | 'QUESTION_CREATED'
    | 'QUESTION_UPDATED'
    | 'QUESTION_ARCHIVED'
    | 'QUESTION_DELETED'
    | 'QUESTION_CLONED'
    | 'QUESTION_IMPORTED'
    | 'ASSESSMENT_CREATED'
    | 'ASSESSMENT_UPDATED'
    | 'ASSESSMENT_PUBLISHED'
    | 'ASSESSMENT_CLOSED'
    | 'ASSESSMENT_DELETED'
    | 'ASSESSMENT_STARTED'
    | 'ASSESSMENT_SUBMITTED'
    | 'ASSESSMENT_AUTO_SUBMITTED'
    | 'ASSESSMENT_GRADED'
    | 'ASSESSMENT_SCORE_EDITED'
    | 'AI_QUESTIONS_GENERATED';
  targetType: 'user' | 'teacher_request' | 'classroom' | 'assignment' | 'assessment' | 'attempt' | 'school' | 'subject' | 'join_request' | 'material' | 'question' | 'system';
  targetId?: string;
  schoolId?: string;
  details: string;
  status: 'success' | 'failure';
}

export type Permission =
  | 'class:create'
  | 'class:read'
  | 'class:update'
  | 'class:delete'
  | 'class:assign_teacher'
  | 'class:review_requests'
  | 'class:join'
  | 'assignment:create'
  | 'assignment:submit'
  | 'proctor:monitor'
  | 'teacher:approve'
  | 'school:manage'
  | 'school:read'
  | 'subject:manage'
  | 'subject:read'
  | 'material:create'
  | 'material:read'
  | 'material:update'
  | 'material:delete'
  | 'material:share'
  | 'question:create'
  | 'question:read'
  | 'question:update'
  | 'question:delete'
  | 'question:share'
  | 'assessment:create'
  | 'assessment:read'
  | 'assessment:update'
  | 'assessment:delete'
  | 'assessment:publish'
  | 'assessment:grade'
  | 'assessment:take'
  | 'audit:read'
  | 'ai:generate';

export interface AIGenerationConfig {
  materialIds?: string[]; // 1 hoặc nhiều ID tài liệu từ Phase 5
  materialTitle?: string;
  textContent?: string; // Nội dung văn bản trực tiếp
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  gradeLevel?: string;
  questionCount: number; // 1 - 30
  questionTypes: QuestionType[]; // ['single_choice', 'multiple_choice', 'true_false', 'essay']
  difficulty: DifficultyLevel; // 'easy' | 'medium' | 'hard'
  customPrompt?: string; // Lệnh tùy chỉnh từ giáo viên
  apiKey?: string; // Khóa Gemini tùy chọn
}

export interface AIGeneratedQuestionDraft {
  id: string; // Tạm thời trong giao diện duyệt
  content: string;
  type: QuestionType;
  options?: string[]; // single_choice, multiple_choice, true_false
  correctAnswer?: number; // single_choice, true_false
  correctAnswers?: number[]; // multiple_choice
  sampleAnswer?: string; // essay
  rubric?: string; // essay
  explanation?: string;
  difficulty: DifficultyLevel;
  topic?: string;
  subjectId?: string;
  subjectName?: string;
  gradeLevel?: string;
  defaultPoints?: number;
  sourceReference?: string; // Trích đoạn gốc từ tài liệu
  isSelected?: boolean;
  validationError?: string;
}

export interface AIGenerationResult {
  success: boolean;
  drafts: AIGeneratedQuestionDraft[];
  sourceMaterialIds: string[];
  summary: {
    totalRequested: number;
    totalGenerated: number;
    byType: Record<QuestionType, number>;
    difficulty: DifficultyLevel;
  };
  warnings?: string[];
}

export type ApiResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: { code: string; message: string; details?: any } };


