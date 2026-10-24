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
  teacherCount: number;
  studentCount: number;
  classCount: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export interface TeacherApprovalRequest {
  id: string;
  fullName: string;
  email: string;
  schoolName: string;
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

export interface Classroom {
  id: string;
  code: string; // Mã tham gia 6 ký tự, ví dụ: "UIT-8821"
  name: string;
  subject: string;
  grade?: string; // Khối 10, Khối 11, Khối 12, ĐH...
  academicYear?: string; // 2026-2027
  teacherId: string;
  teacherName: string;
  description: string;
  studentCount: number;
  studentIds: string[];
  documentCount?: number;
  materials?: ClassMaterial[];
  createdAt: string;
}

export type AssignmentType = 'practice' | 'exam';

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

