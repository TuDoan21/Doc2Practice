import type {
  Classroom,
  ClassAssignment,
  StudentSubmission,
  AppNotification,
  UserRole,
  AssignmentType
} from '../types';
import { getCurrentUser } from './auth';

const KEYS = {
  CLASSES: 'd2p_classes_v1',
  ASSIGNMENTS: 'd2p_assignments_v1',
  SUBMISSIONS: 'd2p_submissions_v1',
  NOTIFICATIONS: 'd2p_notifications_v1',
};

// Dữ liệu mẫu lớp học ban đầu
const initialClassrooms: Classroom[] = [
  {
    id: 'class-web-01',
    code: 'WEB-8821',
    name: 'Lập trình Web & TypeScript (SE104.P12)',
    subject: 'Công nghệ phần mềm',
    teacherId: 'usr-teacher-01',
    teacherName: 'ThS. Trần Thị Giáo Viên',
    description: 'Lớp học chuyên sâu về React, TypeScript, quản lý State và xây dựng ứng dụng web hiện đại.',
    studentCount: 38,
    studentIds: ['usr-student-01', 'usr-student-02', 'usr-student-03'],
    createdAt: '2026-10-10',
  },
  {
    id: 'class-ai-02',
    code: 'AI-2026',
    name: 'Nhập môn Trí tuệ Nhân tạo (CS221.N11)',
    subject: 'Khoa học máy tính',
    teacherId: 'usr-teacher-01',
    teacherName: 'ThS. Trần Thị Giáo Viên',
    description: 'Ôn tập kiến thức thuật toán tìm kiếm, Machine Learning cơ bản và mạng nơ-ron.',
    studentCount: 45,
    studentIds: ['usr-student-01', 'usr-student-04'],
    createdAt: '2026-10-12',
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
    tabSwitchCount: 1, // 1 lần chuyển tab
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
    tabSwitchCount: 4, // Vi phạm nhiều lần
    status: 'violation_auto_submitted',
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
  if (!localStorage.getItem(KEYS.CLASSES)) {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(initialClassrooms));
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

export const getClassrooms = (): Classroom[] => {
  initClassStorage();
  try {
    const raw = localStorage.getItem(KEYS.CLASSES);
    return raw ? JSON.parse(raw) : initialClassrooms;
  } catch {
    return initialClassrooms;
  }
};

export const getClassroomById = (id: string): Classroom | undefined => {
  return getClassrooms().find((c) => c.id === id);
};

export const createClassroom = (params: {
  name: string;
  subject: string;
  description: string;
}): Classroom => {
  const user = getCurrentUser();
  const classes = getClassrooms();

  // Tạo mã lớp 6 ký tự ngẫu nhiên dễ nhớ
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const prefix = params.subject.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CLS');
  const code = `${prefix}-${randomSuffix}`;

  const newClass: Classroom = {
    id: `class-${Date.now()}`,
    code,
    name: params.name,
    subject: params.subject,
    teacherId: user.id,
    teacherName: user.fullName,
    description: params.description,
    studentCount: 1, // ban đầu có thể đã có 1 học sinh mẫu
    studentIds: ['usr-student-01'],
    createdAt: new Date().toISOString().split('T')[0],
  };

  classes.unshift(newClass);
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
  window.dispatchEvent(new Event('classes_updated'));
  return newClass;
};

// Học sinh tham gia lớp học bằng mã code
export const joinClassroomByCode = (code: string): { success: boolean; message: string; classroom?: Classroom } => {
  const user = getCurrentUser();
  const classes = getClassrooms();
  const normalizedCode = code.trim().toUpperCase();

  const found = classes.find((c) => c.code.toUpperCase() === normalizedCode);
  if (!found) {
    return { success: false, message: 'Mã lớp học không tồn tại. Vui lòng kiểm tra lại ký tự và dấu gạch nối.' };
  }

  if (found.studentIds.includes(user.id)) {
    return { success: true, message: 'Bạn đã tham gia lớp học này từ trước.', classroom: found };
  }

  found.studentIds.push(user.id);
  found.studentCount += 1;
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));

  // Gửi thông báo cho giáo viên
  addNotification({
    recipientRole: 'teacher',
    recipientUserId: found.teacherId,
    title: 'Học sinh mới tham gia lớp',
    message: `Học sinh ${user.fullName} vừa tham gia lớp "${found.name}" bằng mã ${found.code}.`,
    type: 'info',
    link: '/app/classes',
  });

  window.dispatchEvent(new Event('classes_updated'));
  return { success: true, message: `Tham gia thành công lớp: "${found.name}"!`, classroom: found };
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
  type: AssignmentType; // 'practice' (bài ôn) | 'exam' (kiểm tra)
  durationMinutes: number;
  preventTabSwitch: boolean;
  maxTabSwitchViolations?: number;
  dueDate: string;
  totalQuestions: number;
}): ClassAssignment => {
  const assignments = getAssignments();
  const classroom = getClassroomById(params.classId);

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

  // Gửi thông báo cho toàn bộ học sinh
  addNotification({
    recipientRole: 'student',
    title: params.type === 'exam' ? 'Bài kiểm tra mới' : 'Bài ôn tập mới',
    message: `Giáo viên vừa giao ${params.type === 'exam' ? 'bài kiểm tra' : 'bài ôn tập'}: "${params.title}" trong lớp ${newAssignment.className}. Hạn chót: ${params.dueDate}.`,
    type: 'assignment',
    link: '/app/classes',
  });

  window.dispatchEvent(new Event('assignments_updated'));
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

// Ghi nhận bài nộp của học sinh và thông báo cho giáo viên
export const recordStudentSubmission = (submission: Omit<StudentSubmission, 'id' | 'submittedAt'>): StudentSubmission => {
  const submissions = getSubmissions();
  const assignments = getAssignments();

  const newSubmission: StudentSubmission = {
    ...submission,
    id: `sub-${Date.now()}`,
    submittedAt: new Date().toLocaleString('vi-VN'),
  };

  submissions.unshift(newSubmission);
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(submissions));

  // Cập nhật số bài đã nộp của assignment
  const asg = assignments.find((a) => a.id === submission.assignmentId);
  if (asg) {
    asg.submissionCount += 1;
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }

  // TỰ ĐỘNG THÔNG BÁO VỀ CHO GIÁO VIÊN BIẾT
  const classroom = getClassroomById(submission.classId);
  const teacherId = classroom?.teacherId;
  const violationNotice = submission.tabSwitchCount > 0
    ? ` (⚠️ Phát hiện ${submission.tabSwitchCount} lần rời màn hình thi!)`
    : ' (Không ghi nhận vi phạm)';

  addNotification({
    recipientRole: 'teacher',
    recipientUserId: teacherId,
    title: submission.status === 'violation_auto_submitted'
      ? 'Học sinh bị thu bài do vi phạm'
      : 'Học sinh vừa nộp bài kiểm tra',
    message: `${submission.studentName} (${submission.studentEmail}) vừa nộp bài "${asg?.title || 'Bài thi'}" trong lớp ${submission.className} - Đạt ${submission.score}% (${submission.correctCount}/${submission.totalQuestions} câu)${violationNotice}.`,
    type: submission.tabSwitchCount > 0 ? 'violation' : 'submission',
    link: '/app/classes',
  });

  window.dispatchEvent(new Event('submissions_updated'));
  return newSubmission;
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
  window.dispatchEvent(new Event('notifications_updated'));
  return newNotif;
};

export const markNotificationAsRead = (id: string): void => {
  const list = getNotifications();
  const found = list.find((n) => n.id === id);
  if (found) {
    found.read = true;
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
    window.dispatchEvent(new Event('notifications_updated'));
  }
};

export const markAllNotificationsAsRead = (): void => {
  const list = getNotifications();
  list.forEach((n) => (n.read = true));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
  window.dispatchEvent(new Event('notifications_updated'));
};
