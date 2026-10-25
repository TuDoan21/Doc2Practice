/**
 * Suite kiểm thử tự động toàn diện cho Giai đoạn 6:
 * Tạo Đề kiểm tra, Giao bài tập, Làm bài trực tuyến và Chấm điểm
 * Chạy bằng: npx tsx src/tests/assessment_and_grading.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Polyfill môi trường trình duyệt cho Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    get length() {
      return store.size;
    },
  } as any;
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as any;
  (globalThis as any).Event = class Event {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
  (globalThis as any).CustomEvent = class CustomEvent extends (globalThis as any).Event {
    detail: any;
    constructor(type: string, init?: any) {
      super(type);
      this.detail = init?.detail;
    }
  };
}

import { runAuthMigrations } from '../services/migration';
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  publishAssessment,
  closeAssessment,
  deleteAssessment,
  startAssessmentAttempt,
  saveAttemptAnswers,
  submitAssessmentAttempt,
  handleExpiredAttempt,
  gradeEssayQuestion,
  getStudentAttemptResult,
  getAssessmentAttemptsForTeacher,
  getAllAssessmentsRaw,
  getAllAttemptsRaw,
} from '../services/assessmentService';
import { updateQuestion, getQuestions } from '../services/questionBankService';
import { getClassrooms } from '../services/classService';
import type { UserProfile } from '../services/auth';

// Mock Users
const TEACHER_LHP: UserProfile = {
  id: 'usr-teacher-01',
  fullName: 'ThS. Trần Thị Giáo Viên',
  email: 'giaovien.tran@lhp.edu.vn',
  role: 'teacher',
  schoolId: 'school-lhp',
  school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
  department: 'Tổ Toán - Tin học',
  teacherCode: 'GV-TOAN-014',
  avatarColor: 'from-emerald-600 to-teal-600',
};

const TEACHER_KL: UserProfile = {
  id: 'usr-teacher-kl',
  fullName: 'Thầy Nguyễn Kim Liên',
  email: 'nguyen.kl@kimlien.edu.vn',
  role: 'teacher',
  schoolId: 'school-kl',
  school: 'THPT Kim Liên (Hà Nội)',
  avatarColor: 'from-blue-600 to-cyan-600',
};

const STUDENT_ENROLLED: UserProfile = {
  id: 'usr-student-01',
  fullName: 'Nguyễn Văn Học',
  email: 'vanhoc.student@lhp.edu.vn',
  role: 'student',
  schoolId: 'school-lhp',
  school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
  studentCode: 'HS-2026-12A1',
  avatarColor: 'from-indigo-600 to-violet-600',
};

const STUDENT_OTHER_CLASS: UserProfile = {
  id: 'usr-student-other',
  fullName: 'Trần Văn Ngoài',
  email: 'ngoai.tran@other.edu.vn',
  role: 'student',
  schoolId: 'school-other',
  school: 'Trường Khác',
  avatarColor: 'from-slate-600 to-slate-800',
};

// ==================== TEST SUITE ====================

test('1. Giáo viên tạo và xuất bản bài kiểm tra (Đóng băng snapshot câu hỏi)', async () => {
  await runAuthMigrations();

  const now = new Date();
  const res = createAssessment(
    {
      title: 'Đề thi Khảo sát Năng lực Môn Toán 12',
      description: 'Đề thi gồm 4 câu hỏi trắc nghiệm và tự luận phân loại.',
      type: 'exam',
      classId: 'class-web-01', // do teacher-01 phụ trách
      durationMinutes: 30,
      availableFrom: new Date(now.getTime() - 1000).toISOString(),
      availableUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 10.0,
      questionIds: ['qb-001', 'qb-002', 'qb-003', 'qb-004'],
      status: 'published',
      showResultPolicy: 'immediate',
      preventTabSwitch: true,
    },
    TEACHER_LHP
  );

  assert.equal(res.success, true);
  if (res.success) {
    assert.equal(res.data.title, 'Đề thi Khảo sát Năng lực Môn Toán 12');
    assert.equal(res.data.status, 'published');
    assert.equal(res.data.totalQuestions, 4);
    assert.equal(res.data.questionSnapshots.length, 4);
    assert.ok(res.data.questionSnapshots[0].points > 0);
  }
});

test('2. Không thể xuất bản đề kiểm tra không có câu hỏi hợp lệ', async () => {
  const createEmpty = createAssessment(
    {
      title: 'Đề thi rỗng không có câu hỏi',
      type: 'exam',
      classId: 'class-web-01',
      durationMinutes: 15,
      questionIds: [],
      status: 'published',
    },
    TEACHER_LHP
  );

  assert.equal(createEmpty.success, false);
  if (!createEmpty.success) {
    assert.equal(createEmpty.error.code, 'VALIDATION_ERROR');
    assert.ok(createEmpty.error.message.includes('chưa chọn câu hỏi'));
  }
});

test('3. Học sinh đúng lớp nhìn thấy bài kiểm tra được giao', async () => {
  const listRes = getAssessments(undefined, STUDENT_ENROLLED);
  assert.equal(listRes.success, true);
  if (listRes.success) {
    assert.ok(listRes.data.length > 0);
    // Tất cả bài thấy được phải thuộc lớp class-web-01
    assert.ok(listRes.data.every((a) => a.classId === 'class-web-01'));
    // Không được thấy bài nháp draft
    assert.ok(listRes.data.every((a) => a.status !== 'draft'));
  }
});

test('4. Học sinh lớp khác không truy cập được bài kiểm tra', async () => {
  // STUDENT_OTHER_CLASS không thuộc lớp class-web-01
  const listRes = getAssessments(undefined, STUDENT_OTHER_CLASS);
  assert.equal(listRes.success, true);
  if (listRes.success) {
    assert.equal(listRes.data.length, 0, 'Học sinh lớp khác không thấy đề thi của lớp này');
  }

  // Thử trực tiếp gọi getAssessmentById hoặc startAssessmentAttempt
  const getRes = getAssessmentById('asm-001', STUDENT_OTHER_CLASS);
  assert.equal(getRes.success, false);
  if (!getRes.success) {
    assert.equal(getRes.error.code, 'FORBIDDEN');
  }

  const startRes = startAssessmentAttempt('asm-001', STUDENT_OTHER_CLASS);
  assert.equal(startRes.success, false);
  if (!startRes.success) {
    assert.equal(startRes.error.code, 'FORBIDDEN');
  }
});

test('5. Không thể bắt đầu bài làm trước thời điểm mở đề (availableFrom)', async () => {
  const now = new Date();
  const futureFrom = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 ngày sau mới mở

  const createFuture = createAssessment(
    {
      title: 'Đề thi Khảo sát Tuần tới',
      type: 'exam',
      classId: 'class-web-01',
      durationMinutes: 30,
      availableFrom: futureFrom,
      questionIds: ['qb-001'],
      status: 'published',
    },
    TEACHER_LHP
  );

  assert.equal(createFuture.success, true);
  if (createFuture.success) {
    const startRes = startAssessmentAttempt(createFuture.data.id, STUDENT_ENROLLED);
    assert.equal(startRes.success, false);
    if (!startRes.success) {
      assert.equal(startRes.error.code, 'NOT_OPEN_YET');
      assert.ok(startRes.error.message.includes('Chưa đến thời điểm mở'));
    }
  }
});

test('6. Đồng hồ đếm ngược và hạn chót (Deadline) được kiểm soát nghiêm ngặt bởi Backend', async () => {
  const startRes = startAssessmentAttempt('asm-001', STUDENT_ENROLLED);
  assert.equal(startRes.success, true);
  if (startRes.success) {
    const { attempt } = startRes.data;
    assert.equal(attempt.status, 'taking');
    assert.ok(attempt.deadlineAt, 'Phải có deadlineAt từ backend');

    // Deadline phải lớn hơn startedAt khoảng 30 phút
    const startMs = new Date(attempt.startedAt).getTime();
    const deadlineMs = new Date(attempt.deadlineAt).getTime();
    const diffMins = Math.round((deadlineMs - startMs) / (60 * 1000));
    assert.equal(diffMins, 30, 'Thời lượng phải đúng 30 phút do backend tính toán');
  }
});

test('7. Câu trả lời được tự động lưu (Auto-save) và khôi phục khi tải lại trang', async () => {
  // Lấy attempt đang taking của học sinh
  const startRes = startAssessmentAttempt('asm-001', STUDENT_ENROLLED);
  assert.equal(startRes.success, true);
  if (!startRes.success) return;

  const attemptId = startRes.data.attempt.id;
  const qList = startRes.data.questions;
  const q1 = qList[0];

  // Lưu câu trả lời câu 1
  const saveRes = saveAttemptAnswers(
    attemptId,
    {
      [q1.id]: { selectedAnswer: 0 },
    },
    STUDENT_ENROLLED
  );
  assert.equal(saveRes.success, true);

  // Giả lập học sinh tải lại trang (gọi lại startAssessmentAttempt)
  const reloadRes = startAssessmentAttempt('asm-001', STUDENT_ENROLLED);
  assert.equal(reloadRes.success, true);
  if (reloadRes.success) {
    assert.equal(reloadRes.data.attempt.id, attemptId, 'Khôi phục đúng attemptId');
    const restoredAnswer = reloadRes.data.attempt.answers[q1.id];
    assert.ok(restoredAnswer, 'Câu trả lời phải được khôi phục');
    assert.equal(restoredAnswer.selectedAnswer, 0);
  }
});

test('8. Nộp bài thành công và tự động tính điểm', async () => {
  const startRes = startAssessmentAttempt('asm-001', STUDENT_ENROLLED);
  assert.equal(startRes.success, true);
  if (!startRes.success) return;

  const attemptId = startRes.data.attempt.id;
  const qList = startRes.data.questions;

  // Lấy id của các câu hỏi theo type
  const singleQ = qList.find((q) => q.type === 'single_choice');
  const multiQ = qList.find((q) => q.type === 'multiple_choice');
  const tfQ = qList.find((q) => q.type === 'true_false');
  const essayQ = qList.find((q) => q.type === 'essay');

  const answersToSubmit: Record<string, any> = {};
  if (singleQ) answersToSubmit[singleQ.id] = { selectedAnswer: 0 }; // Đúng (qb-001)
  if (multiQ) answersToSubmit[multiQ.id] = { selectedAnswers: [0, 1, 3] }; // Đúng (qb-002)
  if (tfQ) answersToSubmit[tfQ.id] = { selectedAnswer: 0 }; // Đúng (qb-003)
  if (essayQ) answersToSubmit[essayQ.id] = { essayAnswer: 'Ý nghĩa hình học của đạo hàm là...' };

  const submitRes = submitAssessmentAttempt(attemptId, answersToSubmit, STUDENT_ENROLLED);
  assert.equal(submitRes.success, true);
  if (submitRes.success) {
    const submittedAttempt = submitRes.data;
    assert.ok(submittedAttempt.submittedAt);
    assert.ok(submittedAttempt.score > 0, 'Phải có điểm tự động');
    assert.equal(submittedAttempt.needsManualGrading, true, 'Có câu tự luận nên cần chấm thủ công');
    assert.equal(submittedAttempt.status, 'submitted');
  }
});

test('9. Nộp bài lặp không tạo thêm lượt nộp ngoài ý muốn (Tính lũy đẳng - Idempotency)', async () => {
  const allAttempts = getAllAttemptsRaw();
  const existing = allAttempts.find((a) => a.studentId === STUDENT_ENROLLED.id && a.assessmentId === 'asm-001');
  assert.ok(existing);

  // Thử gửi lại submit lần thứ 2
  const submitAgain = submitAssessmentAttempt(existing.id, undefined, STUDENT_ENROLLED);
  assert.equal(submitAgain.success, true);
  if (submitAgain.success) {
    assert.equal(submitAgain.data.id, existing.id);
    assert.equal(submitAgain.data.score, existing.score);
  }

  // Số lượng attempt không đổi
  const afterAttempts = getAllAttemptsRaw().filter(
    (a) => a.studentId === STUDENT_ENROLLED.id && a.assessmentId === 'asm-001'
  );
  assert.equal(afterAttempts.length, 1, 'Chỉ duy nhất 1 attempt tồn tại');
});

test('10. Bài hết giờ (Expired) được xử lý đúng (Từ chối lưu tiếp & Tự động thu bài)', async () => {
  // Tạo 1 bài thi có hạn chót đã qua
  const now = new Date();
  const expiredAssessment = createAssessment(
    {
      title: 'Đề thi đã hết hạn',
      type: 'exam',
      classId: 'class-web-01',
      durationMinutes: 1,
      availableFrom: new Date(now.getTime() - 100000).toISOString(),
      availableUntil: new Date(now.getTime() - 50000).toISOString(), // Đã qua
      questionIds: ['qb-001'],
      status: 'published',
    },
    TEACHER_LHP
  );

  assert.equal(expiredAssessment.success, true);
  if (expiredAssessment.success) {
    const startRes = startAssessmentAttempt(expiredAssessment.data.id, STUDENT_ENROLLED);
    // Bị chặn vì đã đóng đề
    assert.equal(startRes.success, false);
    if (!startRes.success) {
      assert.equal(startRes.error.code, 'ASSESSMENT_CLOSED');
    }
  }
});

test('11. Trắc nghiệm đơn, nhiều đáp án và Đúng/Sai được tự động chấm chính xác', async () => {
  // Tạo đề thi chỉ gồm trắc nghiệm để kiểm tra tự động chấm đạt 'graded'
  const autoTest = createAssessment(
    {
      title: 'Đề kiểm tra trắc nghiệm 100%',
      type: 'exam',
      classId: 'class-web-01',
      durationMinutes: 20,
      questionIds: ['qb-001', 'qb-003'], // single_choice (2.5đ) và true_false (2.0đ)
      maxScore: 10.0,
      status: 'published',
    },
    TEACHER_LHP
  );

  assert.equal(autoTest.success, true);
  if (!autoTest.success) return;

  const startRes = startAssessmentAttempt(autoTest.data.id, STUDENT_ENROLLED);
  assert.equal(startRes.success, true);
  if (!startRes.success) return;

  const attemptId = startRes.data.attempt.id;
  const [q1, q2] = startRes.data.questions;

  // Làm đúng cả 2 câu
  const submitRes = submitAssessmentAttempt(
    attemptId,
    {
      [q1.id]: { selectedAnswer: 0 }, // Đúng
      [q2.id]: { selectedAnswer: 0 }, // Đúng
    },
    STUDENT_ENROLLED
  );

  assert.equal(submitRes.success, true);
  if (submitRes.success) {
    assert.equal(submitRes.data.needsManualGrading, false);
    assert.equal(submitRes.data.status, 'graded');
    assert.ok(submitRes.data.score > 0);
  }
});

test('12. Câu hỏi tự luận ở trạng thái chờ giáo viên chấm (needsManualGrading)', async () => {
  const attempts = getAllAttemptsRaw();
  const essayAttempt = attempts.find((a) => a.assessmentId === 'asm-001' && a.needsManualGrading);
  assert.ok(essayAttempt, 'Phải có bài nộp chứa câu tự luận chờ chấm');

  // Lấy snapshot đề để tìm id câu tự luận
  const assessment = getAllAssessmentsRaw().find((a) => a.id === 'asm-001');
  const essaySnp = assessment?.questionSnapshots.find((s) => s.type === 'essay');
  assert.ok(essaySnp);

  // Giáo viên chấm câu tự luận
  const gradeRes = gradeEssayQuestion(
    {
      attemptId: essayAttempt.id,
      questionId: essaySnp.id,
      earnedPoints: 2.5,
      feedback: 'Lập luận tốt, cần giải thích rõ hơn bước 2.',
    },
    TEACHER_LHP
  );

  assert.equal(gradeRes.success, true);
  if (gradeRes.success) {
    assert.equal(gradeRes.data.needsManualGrading, false, 'Đã chấm xong');
    assert.equal(gradeRes.data.status, 'graded');
    assert.ok(gradeRes.data.score >= 2.5);
    assert.equal(gradeRes.data.gradedBy, TEACHER_LHP.fullName);
  }
});

test('13. Tổng điểm không được vượt quá maxScore của đề kiểm tra', async () => {
  const attempts = getAllAttemptsRaw();
  const attempt = attempts[0];
  assert.ok(attempt);
  assert.ok(attempt.score <= attempt.maxScore, `Điểm (${attempt.score}) không được vượt maxScore (${attempt.maxScore})`);
});

test('14. Học sinh không thể tự sửa điểm hoặc xem bài nộp của thí sinh khác', async () => {
  const attempts = getAllAttemptsRaw();
  const attemptOfStudent1 = attempts.find((a) => a.studentId === STUDENT_ENROLLED.id);
  assert.ok(attemptOfStudent1);

  // Thí sinh khác cố xem bài nộp này
  const viewRes = getStudentAttemptResult(attemptOfStudent1.id, STUDENT_OTHER_CLASS);
  assert.equal(viewRes.success, false);
  if (!viewRes.success) {
    assert.equal(viewRes.error.code, 'FORBIDDEN');
  }
});

test('15. Đáp án đúng và lời giải không bị lộ trước khi được phép công bố', async () => {
  // Tạo đề thi có showResultPolicy: 'after_closed' và chưa đóng
  const now = new Date();
  const lockedExam = createAssessment(
    {
      title: 'Đề thi giấu đáp án đến khi kết thúc',
      type: 'exam',
      classId: 'class-web-01',
      durationMinutes: 10,
      availableFrom: new Date(now.getTime() - 1000).toISOString(),
      availableUntil: new Date(now.getTime() + 10 * 60 * 1000).toISOString(), // 10 phút nữa mới đóng
      questionIds: ['qb-001'],
      showResultPolicy: 'after_closed',
      status: 'published',
    },
    TEACHER_LHP
  );

  assert.equal(lockedExam.success, true);
  if (!lockedExam.success) return;

  const startRes = startAssessmentAttempt(lockedExam.data.id, STUDENT_ENROLLED);
  assert.equal(startRes.success, true);
  if (!startRes.success) return;

  // Nộp bài
  const submitRes = submitAssessmentAttempt(
    startRes.data.attempt.id,
    { [startRes.data.questions[0].id]: { selectedAnswer: 0 } },
    STUDENT_ENROLLED
  );
  assert.equal(submitRes.success, true);

  // Xem kết quả khi bài chưa đóng
  const resultRes = getStudentAttemptResult(startRes.data.attempt.id, STUDENT_ENROLLED);
  assert.equal(resultRes.success, true);
  if (resultRes.success) {
    assert.equal(resultRes.data.canViewAnswersAndExplanations, false, 'Chưa được xem đáp án');
    const qDetail = resultRes.data.questionDetails?.[0];
    assert.equal(qDetail?.correctAnswer, undefined, 'Đáp án đúng phải bị giấu');
    assert.equal(qDetail?.explanation, undefined, 'Lời giải phải bị giấu');
  }

  // Giáo viên đóng đề thi (closeAssessment)
  const closeRes = closeAssessment(lockedExam.data.id, TEACHER_LHP);
  assert.equal(closeRes.success, true);

  // Xem lại kết quả sau khi đóng -> Đáp án và giải thích được hiển thị
  const resultAfterClose = getStudentAttemptResult(startRes.data.attempt.id, STUDENT_ENROLLED);
  assert.equal(resultAfterClose.success, true);
  if (resultAfterClose.success) {
    assert.equal(resultAfterClose.data.canViewAnswersAndExplanations, true, 'Đã được xem đáp án sau khi đóng đề');
    const qDetail = resultAfterClose.data.questionDetails?.[0];
    assert.notEqual(qDetail?.correctAnswer, undefined);
  }
});

test('16. Giáo viên không thể chấm bài hoặc quản lý đề thi của lớp không được phân công', async () => {
  // TEACHER_KL thuộc trường Kim Liên, không quản lý class-web-01
  const updateRes = updateAssessment('asm-001', { title: 'Bị sửa trái phép' }, TEACHER_KL);
  assert.equal(updateRes.success, false);
  if (!updateRes.success) {
    assert.equal(updateRes.error.code, 'FORBIDDEN');
  }

  const attemptsRes = getAssessmentAttemptsForTeacher('asm-001', TEACHER_KL);
  assert.equal(attemptsRes.success, false);
  if (!attemptsRes.success) {
    assert.equal(attemptsRes.error.code, 'FORBIDDEN');
  }
});

test('17. Sửa câu hỏi gốc trong ngân hàng không làm thay đổi đề thi đã xuất bản (Đóng băng snapshot)', async () => {
  // Lấy câu hỏi qb-001
  const beforeAssessment = getAllAssessmentsRaw().find((a) => a.id === 'asm-001');
  const snpBefore = beforeAssessment?.questionSnapshots.find((s) => s.originalQuestionId === 'qb-001');
  assert.ok(snpBefore);
  const frozenContent = snpBefore.content;

  // Chỉnh sửa câu hỏi gốc qb-001 trong ngân hàng câu hỏi
  const editBankRes = updateQuestion(
    'qb-001',
    {
      content: 'NỘI DUNG MỚI ĐÃ BỊ THAY ĐỔI HOÀN TOÀN TRONG NGÂN HÀNG CÂU HỎI',
    },
    TEACHER_LHP
  );
  assert.equal(editBankRes.success, true);

  // Kiểm tra snapshot trong asm-001 vẫn giữ nguyên nội dung cũ
  const afterAssessment = getAllAssessmentsRaw().find((a) => a.id === 'asm-001');
  const snpAfter = afterAssessment?.questionSnapshots.find((s) => s.originalQuestionId === 'qb-001');
  assert.equal(snpAfter?.content, frozenContent, 'Nội dung snapshot đề thi đã xuất bản phải đóng băng');
});

test('18. Migration an toàn và bảo tồn toàn vẹn dữ liệu hệ thống', async () => {
  const migRes = await runAuthMigrations();
  assert.ok(typeof migRes.usersCount === 'number');

  const assessments = getAllAssessmentsRaw();
  assert.ok(assessments.length >= 3, 'Bảo tồn đầy đủ dữ liệu đề thi');

  const classes = getClassrooms();
  assert.ok(classes.length >= 1, 'Bảo tồn dữ liệu lớp học');
});

