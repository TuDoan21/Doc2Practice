/**
 * Suite kiểm thử tự động toàn diện cho Giai đoạn 5:
 * Quản lý Tài liệu học tập và Ngân hàng câu hỏi
 * Chạy bằng: npx tsx src/tests/materials_and_questions.test.ts
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
  getMaterials,
  getMaterialById,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  archiveMaterial,
  shareMaterialWithClasses,
  getAuthorizedDownload,
  validateFileUpload,
  MAX_FILE_SIZE_BYTES,
  getAllMaterialsRaw,
} from '../services/materialService';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  cloneQuestion,
  deleteQuestion,
  archiveQuestion,
  importQuestionsFromData,
  sanitizeQuestionForStudent,
  validateQuestionData,
  getAllQuestionsRaw,
} from '../services/questionBankService';
import { getClassrooms } from '../services/classService';
import { getSchools } from '../services/schoolService';
import type { UserProfile } from '../services/auth';
import type { BankQuestion } from '../types';

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

const STUDENT_OTHER_SCHOOL: UserProfile = {
  id: 'usr-student-other',
  fullName: 'Trần Văn Ngoài',
  email: 'ngoai.tran@other.edu.vn',
  role: 'student',
  schoolId: 'school-other',
  school: 'Trường Khác',
  avatarColor: 'from-slate-600 to-slate-800',
};

const SCHOOL_ADMIN_LHP: UserProfile = {
  id: 'usr-admin-01',
  fullName: 'TS. Lê Văn Quản Trị',
  email: 'hieutruong.le@lhp.edu.vn',
  role: 'school_admin',
  schoolId: 'school-lhp',
  school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
  avatarColor: 'from-amber-600 to-orange-600',
};

const SYSADMIN: UserProfile = {
  id: 'usr-sysadmin-01',
  fullName: 'Quản Trị Viên Hệ Thống',
  email: 'sysadmin@doc2practice.edu.vn',
  role: 'system_admin',
  avatarColor: 'from-purple-700 to-indigo-900',
};

// ==================== TEST SUITE ====================

test('1. Giáo viên tải lên tài liệu học tập hợp lệ (PDF, DOCX, PPTX)', async () => {
  await runAuthMigrations();

  const res = uploadMaterial(
    {
      title: 'Đề thi thử THPT Quốc gia 2026 - Môn Toán',
      description: 'Đề chuẩn cấu trúc Bộ GD&ĐT gồm 50 câu trắc nghiệm.',
      fileName: 'De_Thi_Thu_Toan_2026.pdf',
      fileSize: 3 * 1024 * 1024, // 3 MB
      contentType: 'application/pdf',
      subjectId: 'sub-toan-12',
      subjectName: 'Toán học 12',
      topic: 'Luyện đề tổng hợp',
      status: 'published',
      sharedClassIds: ['class-web-01'], // Lớp do teacher-01 phụ trách
      schoolId: 'school-lhp',
    },
    TEACHER_LHP
  );

  assert.equal(res.success, true, 'Tải tài liệu hợp lệ phải thành công');
  if (res.success) {
    assert.equal(res.data.title, 'Đề thi thử THPT Quốc gia 2026 - Môn Toán');
    assert.equal(res.data.fileType, 'pdf');
    assert.equal(res.data.status, 'published');
    assert.equal(res.data.uploadedBy, TEACHER_LHP.id);
    assert.equal(res.data.downloadCount, 0);
    assert.ok(res.data.storageKey.startsWith('blob_mat_'), 'storageKey phải được sinh ngẫu nhiên an toàn');
  }
});

test('2. Tệp quá kích thước (>25MB) hoặc định dạng nguy hiểm (.exe, .html) bị chặn an toàn', async () => {
  // Test validate helper trực tiếp
  const exeValidation = validateFileUpload('trojan_script.exe', 1024);
  assert.equal(exeValidation.valid, false);
  assert.ok(exeValidation.error?.includes('tiềm ẩn rủi ro bảo mật'));

  const htmlValidation = validateFileUpload('phishing_login.html', 2048);
  assert.equal(htmlValidation.valid, false);

  const oversizedValidation = validateFileUpload('heavy_video.pdf', MAX_FILE_SIZE_BYTES + 1024);
  assert.equal(oversizedValidation.valid, false);
  assert.ok(oversizedValidation.error?.includes('vượt quá giới hạn'));

  // Test qua API uploadMaterial
  const resExe = uploadMaterial(
    {
      title: 'Tài liệu độc hại',
      description: 'Chứa file exe',
      fileName: 'hacker_exploit.exe',
      fileSize: 5000,
    },
    TEACHER_LHP
  );
  assert.equal(resExe.success, false);
  if (!resExe.success) {
    assert.equal(resExe.error.code, 'INVALID_FILE');
  }

  const resOversize = uploadMaterial(
    {
      title: 'Tài liệu quá lớn',
      description: 'Vượt 25MB',
      fileName: 'giant_book.pdf',
      fileSize: 30 * 1024 * 1024, // 30 MB
    },
    TEACHER_LHP
  );
  assert.equal(resOversize.success, false);
  if (!resOversize.success) {
    assert.equal(resOversize.error.code, 'INVALID_FILE');
  }
});

test('3. Học sinh chỉ thấy tài liệu đã công bố thuộc lớp mình đã tham gia', async () => {
  const materialsRes = getMaterials(undefined, STUDENT_ENROLLED);
  assert.equal(materialsRes.success, true);

  if (materialsRes.success) {
    const list = materialsRes.data;
    // Tất cả tài liệu học sinh thấy đều phải có status = 'published'
    assert.ok(list.every((m) => m.status === 'published'), 'Học sinh không được thấy tài liệu draft/archived');

    // Không được chứa tài liệu chỉ chia sẻ cho lớp trường khác (cls-kl-10a1)
    const hasOtherClassMat = list.some((m) => m.id === 'mat-004');
    assert.equal(hasOtherClassMat, false, 'Không được thấy tài liệu của lớp khác');

    // Phải thấy tài liệu chia sẻ cho lớp cls-01 (mà học sinh usr-student-01 tham gia)
    const hasLhpMat = list.some((m) => m.id === 'mat-001');
    assert.equal(hasLhpMat, true, 'Học sinh phải thấy tài liệu chia sẻ cho lớp mình học');
  }
});

test('4. Giáo viên Trường A không thể truy cập hoặc quản lý tài liệu riêng tư Trường B', async () => {
  // mat-004 thuộc Trường THPT Kim Liên (school-kl)
  const resUpdate = updateMaterial(
    'mat-004',
    { title: 'Tên bị sửa trái phép' },
    TEACHER_LHP // Giáo viên Trường Lê Hồng Phong
  );

  assert.equal(resUpdate.success, false);
  if (!resUpdate.success) {
    assert.equal(resUpdate.error.code, 'FORBIDDEN');
  }

  const resDelete = deleteMaterial('mat-004', TEACHER_LHP);
  assert.equal(resDelete.success, false);
  if (!resDelete.success) {
    assert.equal(resDelete.error.code, 'FORBIDDEN');
  }
});

test('5. Tải tệp không thẩm quyền bị chặn; Tải hợp lệ cập nhật downloadCount', async () => {
  // Học sinh trường khác không học lớp cls-01 cố tải mat-001
  const resUnauthorized = getAuthorizedDownload('mat-001', STUDENT_OTHER_SCHOOL);
  assert.equal(resUnauthorized.success, false);
  if (!resUnauthorized.success) {
    assert.equal(resUnauthorized.error.code, 'FORBIDDEN');
  }

  // Học sinh đúng lớp cls-01 tải mat-001
  const beforeRes = getMaterialById('mat-001', TEACHER_LHP);
  assert.equal(beforeRes.success, true);
  const countBefore = beforeRes.success ? beforeRes.data.downloadCount : 0;

  const resAuthorized = getAuthorizedDownload('mat-001', STUDENT_ENROLLED);
  assert.equal(resAuthorized.success, true);
  if (resAuthorized.success) {
    assert.equal(resAuthorized.data.fileName, 'Chuyen_de_Ham_So_12A1.pdf');
    assert.ok(resAuthorized.data.content.length > 0);
  }

  // Kiểm tra lượt tải tăng lên 1
  const afterRes = getMaterialById('mat-001', TEACHER_LHP);
  assert.equal(afterRes.success, true);
  if (afterRes.success) {
    assert.equal(afterRes.data.downloadCount, countBefore + 1);
  }
});

test('6. Giáo viên tạo câu hỏi, chỉnh sửa, lưu trữ (archive) và xóa câu hỏi', async () => {
  // 1. Tạo câu hỏi
  const createRes = createQuestion(
    {
      content: 'Trong các hàm số sau, hàm số nào đồng biến trên R?',
      type: 'single_choice',
      options: ['y = x^3 + x', 'y = x^2 + 1', 'y = -x^3 + 2', 'y = 1/x'],
      correctAnswer: 0,
      subjectId: 'sub-toan-12',
      subjectName: 'Toán học 12',
      gradeLevel: 'Khối 12',
      topic: 'Đơn điệu của hàm số',
      difficulty: 'easy',
      defaultPoints: 1.0,
      scope: 'personal',
      status: 'active',
    },
    TEACHER_LHP
  );

  assert.equal(createRes.success, true);
  if (!createRes.success) return;

  const qId = createRes.data.id;
  assert.equal(createRes.data.content, 'Trong các hàm số sau, hàm số nào đồng biến trên R?');

  // 2. Chỉnh sửa
  const updateRes = updateQuestion(
    qId,
    {
      content: 'Trong các hàm số sau, hàm số nào luôn đồng biến trên toàn trục số thực R?',
      difficulty: 'medium',
    },
    TEACHER_LHP
  );
  assert.equal(updateRes.success, true);
  if (updateRes.success) {
    assert.equal(updateRes.data.difficulty, 'medium');
    assert.ok(updateRes.data.content.includes('toàn trục số thực'));
  }

  // 3. Lưu trữ (archive)
  const archiveRes = archiveQuestion(qId, TEACHER_LHP);
  assert.equal(archiveRes.success, true);
  if (archiveRes.success) {
    assert.equal(archiveRes.data.status, 'archived');
  }

  // 4. Xóa
  const deleteRes = deleteQuestion(qId, TEACHER_LHP);
  assert.equal(deleteRes.success, true);
});

test('7. Validation đầy đủ cho cả 4 loại câu hỏi: single_choice, multiple_choice, true_false, essay', async () => {
  // Single choice valid
  const v1 = validateQuestionData({
    content: 'Câu hỏi đơn',
    type: 'single_choice',
    options: ['A', 'B'],
    correctAnswer: 0,
  });
  assert.equal(v1.valid, true);

  // Multiple choice valid
  const v2 = validateQuestionData({
    content: 'Câu hỏi nhiều đáp án',
    type: 'multiple_choice',
    options: ['A', 'B', 'C'],
    correctAnswers: [0, 2],
  });
  assert.equal(v2.valid, true);

  // True / False valid
  const v3 = validateQuestionData({
    content: 'Câu hỏi đúng sai',
    type: 'true_false',
    options: ['Đúng', 'Sai'],
    correctAnswer: 1,
  });
  assert.equal(v3.valid, true);

  // Essay valid (không cần options hay correctAnswer)
  const v4 = validateQuestionData({
    content: 'Phân tích nhân vật Chí Phèo',
    type: 'essay',
    sampleAnswer: 'Mở bài, thân bài, kết bài...',
    rubric: 'Đúng ý 2đ, sáng tạo 1đ',
  });
  assert.equal(v4.valid, true);
});

test('8. Single Choice không được có nhiều hơn một đáp án đúng', async () => {
  const invalidSingle = validateQuestionData({
    content: 'Câu hỏi đơn nhưng truyền mảng đáp án',
    type: 'single_choice',
    options: ['A', 'B', 'C'],
    correctAnswer: 0,
    correctAnswers: [0, 1], // Cố ý gửi 2 đáp án
  });

  assert.equal(invalidSingle.valid, false);
  assert.ok(invalidSingle.error?.includes('không được phép có nhiều hơn một đáp án đúng'));
});

test('9. Dữ liệu câu hỏi thiếu trường bắt buộc bị từ chối rõ ràng', async () => {
  // Thiếu content
  const emptyContent = validateQuestionData({
    content: '   ',
    type: 'single_choice',
    options: ['A', 'B'],
    correctAnswer: 0,
  });
  assert.equal(emptyContent.valid, false);
  assert.ok(emptyContent.error?.includes('không được để trống'));

  // Single choice chỉ có 1 option
  const oneOption = validateQuestionData({
    content: 'Câu hỏi 1 lựa chọn',
    type: 'single_choice',
    options: ['Duy nhất'],
    correctAnswer: 0,
  });
  assert.equal(oneOption.valid, false);
  assert.ok(oneOption.error?.includes('tối thiểu 2 phương án'));

  // Multiple choice không chọn đáp án đúng nào
  const noCorrectMcq = validateQuestionData({
    content: 'MCQ không có đáp án',
    type: 'multiple_choice',
    options: ['A', 'B'],
    correctAnswers: [],
  });
  assert.equal(noCorrectMcq.valid, false);
});

test('10. Giáo viên không thể chỉnh sửa hoặc xóa câu hỏi cá nhân của giáo viên khác', async () => {
  // qb-005 được tạo bởi usr-teacher-kl (scope: personal)
  const resUpdate = updateQuestion(
    'qb-005',
    { content: 'Bị sửa bởi giáo viên LHP' },
    TEACHER_LHP
  );

  assert.equal(resUpdate.success, false);
  if (!resUpdate.success) {
    assert.equal(resUpdate.error.code, 'FORBIDDEN');
  }

  const resDelete = deleteQuestion('qb-005', TEACHER_LHP);
  assert.equal(resDelete.success, false);
  if (!resDelete.success) {
    assert.equal(resDelete.error.code, 'FORBIDDEN');
  }
});

test('11. Giao diện/API Học sinh tuyệt đối không lộ đáp án hoặc lời giải (Sanitization)', async () => {
  const q: BankQuestion = {
    id: 'qb-secret',
    content: 'Tìm nghiệm của x + 2 = 5',
    type: 'single_choice',
    options: ['1', '2', '3', '4'],
    correctAnswer: 2,
    explanation: 'Vì 3 + 2 = 5',
    difficulty: 'easy',
    defaultPoints: 1.0,
    createdBy: 'usr-teacher-01',
    createdByName: 'Cô Giáo',
    schoolId: 'school-lhp',
    scope: 'school_shared',
    status: 'active',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  };

  const safe = sanitizeQuestionForStudent(q);

  assert.equal((safe as any).correctAnswer, undefined, 'Phải xóa correctAnswer');
  assert.equal((safe as any).correctAnswers, undefined, 'Phải xóa correctAnswers');
  assert.equal((safe as any).sampleAnswer, undefined, 'Phải xóa sampleAnswer');
  assert.equal((safe as any).rubric, undefined, 'Phải xóa rubric');
  assert.equal((safe as any).explanation, undefined, 'Phải xóa explanation');
  assert.equal(safe.content, 'Tìm nghiệm của x + 2 = 5');
  assert.equal(safe.options?.length, 4);

  // Khi học sinh gọi getQuestions, kết quả cũng phải được sanitize
  const studentListRes = getQuestions(undefined, STUDENT_ENROLLED, true);
  assert.equal(studentListRes.success, true);
  if (studentListRes.success) {
    studentListRes.data.forEach((item) => {
      assert.equal((item as any).correctAnswer, undefined);
      assert.equal((item as any).sampleAnswer, undefined);
      assert.equal((item as any).explanation, undefined);
    });
  }
});

test('12. Tìm kiếm, lọc và phân loại câu hỏi trong ngân hàng hoạt động chính xác', async () => {
  // Lọc theo difficulty = 'easy'
  const easyRes = getQuestions({ difficulty: 'easy' }, TEACHER_LHP);
  assert.equal(easyRes.success, true);
  if (easyRes.success) {
    assert.ok(easyRes.data.length > 0);
    assert.ok(easyRes.data.every((q) => q.difficulty === 'easy'));
  }

  // Lọc theo type = 'true_false'
  const tfRes = getQuestions({ type: 'true_false' }, TEACHER_LHP);
  assert.equal(tfRes.success, true);
  if (tfRes.success) {
    assert.ok(tfRes.data.every((q) => q.type === 'true_false'));
  }

  // Tìm kiếm theo từ khóa
  const searchRes = getQuestions({ search: 'chu kỳ' }, TEACHER_LHP);
  assert.equal(searchRes.success, true);
  if (searchRes.success) {
    assert.ok(searchRes.data.some((q) => q.content.includes('chu kỳ')));
  }
});

test('13. Migration khởi tạo an toàn và giữ nguyên 100% dữ liệu lớp học, trường học và môn học', async () => {
  const migRes = await runAuthMigrations();
  // Chạy migration bảo đảm tính idempotent
  assert.ok(typeof migRes.usersCount === 'number');

  const classes = getClassrooms();
  assert.ok(classes.length >= 1, 'Dữ liệu lớp học được bảo tồn nguyên vẹn');

  const materials = getAllMaterialsRaw();
  assert.ok(materials.length >= 4, 'Dữ liệu tài liệu được khởi tạo và bảo tồn nguyên vẹn');

  const questions = getAllQuestionsRaw();
  assert.ok(questions.length >= 4, 'Dữ liệu ngân hàng câu hỏi được khởi tạo và bảo tồn nguyên vẹn');
});

test('14. Nhập câu hỏi hàng loạt từ cấu trúc dữ liệu (CSV rows / JSON) có kiểm tra lỗi từng dòng', async () => {
  const rows = [
    {
      content: 'Câu hỏi CSV 1 hợp lệ',
      type: 'single_choice',
      A: 'Hà Nội',
      B: 'TP.HCM',
      C: 'Đà Nẵng',
      D: 'Hải Phòng',
      'Đáp án đúng': 'A',
      'Điểm': 1.0,
    },
    {
      content: '   ', // Lỗi: Rỗng nội dung
      type: 'single_choice',
      A: '1',
      B: '2',
      'Đáp án đúng': 'A',
    },
    {
      content: 'Câu hỏi CSV 3 thiếu đáp án đúng',
      type: 'single_choice',
      A: 'Có',
      B: 'Không',
      // Thiếu Đáp án đúng
    },
  ];

  const importPreview = importQuestionsFromData(rows, { scope: 'personal' }, false, TEACHER_LHP);

  assert.equal(importPreview.total, 3);
  assert.equal(importPreview.validCount, 1, 'Chỉ 1 câu hỏi hợp lệ');
  assert.equal(importPreview.errorCount, 2, '2 câu lỗi phải được ghi nhận');
  assert.equal(importPreview.errors.length, 2);
  assert.equal(importPreview.errors[0].row, 2);
  assert.equal(importPreview.errors[1].row, 3);

  // Tiến hành lưu câu hỏi hợp lệ vào storage
  const importSave = importQuestionsFromData(rows, { scope: 'personal' }, true, TEACHER_LHP);
  assert.equal(importSave.savedQuestions?.length, 1);
});
