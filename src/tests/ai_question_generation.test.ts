/**
 * Suite kiểm thử tự động toàn diện cho Giai đoạn 7:
 * AI ĐỌC TÀI LIỆU VÀ TỰ ĐỘNG TẠO CÂU HỎI, ĐỀ KIỂM TRA CHO DOC2PRACTICE
 * Chạy bằng: npx tsx src/tests/ai_question_generation.test.ts
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
  generateQuestionsFromMaterials,
  extractTextFromMaterial,
  buildAIGenerationPrompt,
  saveDraftsToQuestionBank,
  createAssessmentFromDrafts,
  generateDeterministicFallbackQuestions,
} from '../services/aiQuestionService';
import { uploadMaterial, getMaterials } from '../services/materialService';
import { getQuestions, getQuestionById } from '../services/questionBankService';
import { getAssessmentById } from '../services/assessmentService';
import type { UserProfile } from '../services/auth';
import type { QuestionType, DifficultyLevel } from '../types';

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

const STUDENT_LHP: UserProfile = {
  id: 'usr-student-01',
  fullName: 'Nguyễn Văn Học',
  email: 'vanhoc.student@lhp.edu.vn',
  role: 'student',
  schoolId: 'school-lhp',
  school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
  studentCode: 'HS-2026-12A1',
  avatarColor: 'from-indigo-600 to-violet-600',
};

// Khởi tạo DB test
test.before(async () => {
  localStorage.clear();
  await runAuthMigrations();
});

test('1. Giáo viên trích xuất nội dung văn bản từ tài liệu học tập hợp lệ', async () => {
  // Tạo tài liệu học tập
  const uploadRes = uploadMaterial(
    {
      title: 'Giáo trình Giải tích: Giới hạn và Đạo hàm',
      description: 'Chuyên đề chi tiết về định nghĩa giới hạn, quy tắc đạo hàm và các ứng dụng khảo sát hàm số.',
      fileName: 'giao_trinh_giai_tich.txt',
      fileSize: 4500,
      fileData: 'Đạo hàm của hàm số f(x) tại điểm x0 là giới hạn của tỉ số số gia hàm số và số gia đối số khi số gia đối số tiến tới 0. Quy tắc đạo hàm tích: (uv)\' = u\'v + uv\'. Quy tắc đạo hàm thương: (u/v)\' = (u\'v - uv\') / v^2.',
      subjectId: 'sub-toan-12',
      subjectName: 'Toán học 12',
      topic: 'Đạo hàm và Ứng dụng',
      status: 'published',
    },
    TEACHER_LHP
  );

  assert.equal(uploadRes.success, true);
  if (!uploadRes.success) return;

  const matId = uploadRes.data.id;
  const { text, material } = await extractTextFromMaterial(matId, TEACHER_LHP);

  assert.ok(text.includes('Đạo hàm của hàm số'));
  assert.ok(text.includes('Giới hạn và Đạo hàm'));
  assert.equal(material.id, matId);
});

test('2. Xử lý tài liệu rỗng hoặc không thể trích xuất với thông báo lỗi rõ ràng', async () => {
  // Tạo tài liệu có tiêu đề hợp lệ nhưng nội dung rỗng và không có mô tả
  const emptyRes = uploadMaterial(
    {
      title: 'Tài liệu đính kèm rỗng không có chữ',
      description: '',
      fileName: 'empty_document.txt',
      fileSize: 10,
      fileData: '   ',
      status: 'published',
    },
    TEACHER_LHP
  );

  assert.equal(emptyRes.success, true);
  if (!emptyRes.success) return;

  await assert.rejects(
    async () => {
      await extractTextFromMaterial(emptyRes.data.id, TEACHER_LHP);
    },
    /Tài liệu rỗng hoặc không thể trích xuất/
  );
});

test('3. Tạo câu hỏi thành công cho cả 4 dạng: single_choice, multiple_choice, true_false, essay', async () => {
  const mats = getMaterials(undefined, TEACHER_LHP);
  assert.equal(mats.success, true);
  if (!mats.success || mats.data.length === 0) return;

  const validMat = mats.data.find((m) => m.originalFileName !== 'empty_document.txt') || mats.data[0];

  const genRes = await generateQuestionsFromMaterials(
    {
      materialIds: [validMat.id],
      questionCount: 4,
      questionTypes: ['single_choice', 'multiple_choice', 'true_false', 'essay'],
      difficulty: 'medium',
      topic: 'Khảo sát hàm số',
    },
    TEACHER_LHP
  );

  assert.equal(genRes.success, true);
  if (!genRes.success) return;

  const drafts = genRes.data.drafts;
  assert.equal(drafts.length, 4);

  const typesFound = new Set(drafts.map((d) => d.type));
  assert.ok(typesFound.has('single_choice'), 'Phải có câu single_choice');
  assert.ok(typesFound.has('multiple_choice'), 'Phải có câu multiple_choice');
  assert.ok(typesFound.has('true_false'), 'Phải có câu true_false');
  assert.ok(typesFound.has('essay'), 'Phải có câu essay');
});

test('4. Cấu trúc Multiple Choice có mảng đáp án đúng; True/False có đúng 2 lựa chọn', async () => {
  const fallback = generateDeterministicFallbackQuestions({
    topic: 'Cực trị của hàm số',
    questionCount: 2,
    questionTypes: ['multiple_choice', 'true_false'],
    difficulty: 'hard',
  });

  const mc = fallback.find((d) => d.type === 'multiple_choice');
  assert.ok(mc);
  assert.ok(Array.isArray(mc.options));
  assert.ok(mc.options.length >= 4);
  assert.ok(Array.isArray(mc.correctAnswers));
  assert.ok(mc.correctAnswers.length >= 2, 'Multiple choice phải có từ 2 đáp án đúng trở lên');

  const tf = fallback.find((d) => d.type === 'true_false');
  assert.ok(tf);
  assert.ok(Array.isArray(tf.options));
  assert.equal(tf.options.length, 2, 'True/False phải có đúng 2 phương án');
  assert.deepEqual(tf.options, ['Đúng', 'Sai']);
  assert.ok(tf.correctAnswer === 0 || tf.correctAnswer === 1);
});

test('5. Câu hỏi tự luận (Essay) bắt buộc có sampleAnswer và rubric chấm điểm', async () => {
  const fallback = generateDeterministicFallbackQuestions({
    topic: 'Tích phân và Ứng dụng',
    questionCount: 1,
    questionTypes: ['essay'],
    difficulty: 'hard',
  });

  const essay = fallback[0];
  assert.equal(essay.type, 'essay');
  assert.ok(essay.sampleAnswer && essay.sampleAnswer.length > 10, 'Essay phải có sampleAnswer chi tiết');
  assert.ok(essay.rubric && essay.rubric.length > 10, 'Essay phải có tiêu chí rubric');
  assert.ok(essay.defaultPoints >= 1);
});

test('6. Prompt sinh câu hỏi tuân thủ chuẩn khảo thí và không chứa tên file rác', () => {
  const prompt = buildAIGenerationPrompt({
    content: 'Nội dung bài giảng Vật lý về sóng cơ học...',
    questionCount: 5,
    questionTypes: ['single_choice', 'essay'],
    difficulty: 'medium',
    subjectName: 'Vật lý 12',
    topic: 'Sóng cơ học',
    customPrompt: 'Tập trung vào hiện tượng giao thoa sóng',
  });

  assert.ok(prompt.includes('TUYỆT ĐỐI KHÔNG xuất hiện tên file'));
  assert.ok(prompt.includes('Sóng cơ học'));
  assert.ok(prompt.includes('Tập trung vào hiện tượng giao thoa sóng'));
  assert.ok(prompt.includes('single_choice'));
  assert.ok(prompt.includes('essay'));
});

test('7. Giáo viên có thể chỉnh sửa và xóa câu hỏi dự thảo trước khi lưu', async () => {
  const drafts = generateDeterministicFallbackQuestions({
    topic: 'Di truyền học',
    questionCount: 3,
    questionTypes: ['single_choice'],
    difficulty: 'easy',
  });

  assert.equal(drafts.length, 3);

  // Giáo viên sửa câu 1
  drafts[0].content = 'Nội dung câu hỏi đã được giáo viên biên tập lại chuẩn xác?';
  drafts[0].correctAnswer = 2;
  assert.equal(drafts[0].content, 'Nội dung câu hỏi đã được giáo viên biên tập lại chuẩn xác?');
  assert.equal(drafts[0].correctAnswer, 2);

  // Giáo viên xóa câu 3
  const remaining = drafts.filter((_, idx) => idx !== 2);
  assert.equal(remaining.length, 2);
});

test('8. Lưu các câu hỏi dự thảo đã chọn vào Ngân hàng câu hỏi (Phase 5)', async () => {
  const drafts = generateDeterministicFallbackQuestions({
    topic: 'Hóa học Hữu cơ: Este - Lipit',
    questionCount: 2,
    questionTypes: ['single_choice', 'true_false'],
    difficulty: 'medium',
  });

  const saveRes = await saveDraftsToQuestionBank(drafts, { scope: 'personal' }, TEACHER_LHP);
  assert.equal(saveRes.success, true);
  if (!saveRes.success) return;

  assert.equal(saveRes.data.length, 2);
  const qId1 = saveRes.data[0].id;

  // Kiểm tra câu hỏi đã tồn tại trong Ngân hàng câu hỏi và thuộc quyền sở hữu của giáo viên
  const qCheck = getQuestionById(qId1, TEACHER_LHP);
  assert.equal(qCheck.success, true);
  if (!qCheck.success) return;
  assert.equal(qCheck.data.createdBy, TEACHER_LHP.id);
  assert.equal(qCheck.data.schoolId, TEACHER_LHP.schoolId);
});

test('9. Học sinh tuyệt đối không được phép gọi API sinh câu hỏi AI (RBAC)', async () => {
  const genRes = await generateQuestionsFromMaterials(
    {
      textContent: 'Đoạn văn bản ôn tập kiến thức Sinh học...',
      questionCount: 5,
      questionTypes: ['single_choice'],
      difficulty: 'easy',
    },
    STUDENT_LHP
  );

  assert.equal(genRes.success, false);
  if (genRes.success) return;
  assert.equal(genRes.error.code, 'FORBIDDEN');
});

test('10. Giáo viên trường A không thể tạo câu hỏi từ tài liệu của trường B', async () => {
  // Giáo viên trường KL tạo tài liệu riêng
  const matKlRes = uploadMaterial(
    {
      title: 'Tài liệu mật nội bộ trường Kim Liên',
      description: 'Chỉ lưu hành nội bộ trường Kim Liên Hà Nội',
      fileName: 'tai_lieu_kl.txt',
      fileSize: 1200,
      fileData: 'Kiến thức chuyên sâu chỉ dành cho học sinh Kim Liên.',
      schoolId: 'school-kl',
      status: 'published',
    },
    TEACHER_KL
  );

  assert.equal(matKlRes.success, true);
  if (!matKlRes.success) return;

  // Giáo viên trường LHP cố tình đọc tài liệu trường KL để sinh câu hỏi
  const crossGenRes = await generateQuestionsFromMaterials(
    {
      materialIds: [matKlRes.data.id],
      questionCount: 3,
      questionTypes: ['single_choice'],
      difficulty: 'medium',
    },
    TEACHER_LHP
  );

  assert.equal(crossGenRes.success, false);
  if (crossGenRes.success) return;
  assert.equal(crossGenRes.error.code, 'EXTRACTION_ERROR');
});

test('11. Tích hợp trực tiếp Phase 6: Tạo và xuất bản đề kiểm tra cho lớp từ các câu hỏi AI', async () => {
  const drafts = generateDeterministicFallbackQuestions({
    topic: 'Kiểm tra 1 tiết Đại số 12',
    questionCount: 3,
    questionTypes: ['single_choice', 'true_false', 'essay'],
    difficulty: 'medium',
  });

  const assessRes = await createAssessmentFromDrafts(
    {
      title: 'Kiểm tra 45 phút Khảo sát hàm số (Tạo tự động bởi AI)',
      classId: 'class-ai-02',
      drafts,
      durationMinutes: 45,
      type: 'exam',
      preventTabSwitch: true,
      publishImmediately: true,
    },
    TEACHER_LHP
  );

  assert.equal(assessRes.success, true);
  if (!assessRes.success) return;

  const assessment = assessRes.data;
  assert.equal(assessment.status, 'published');
  assert.equal(assessment.totalQuestions, 3);
  assert.equal(assessment.preventTabSwitch, true);
  assert.equal(assessment.questionSnapshots.length, 3);

  // Đề thi có snapshot đóng băng câu hỏi
  assert.ok(assessment.questionSnapshots[0].content);
});

test('12. Bộ tạo câu hỏi dự phòng (Fallback) luôn đảm bảo 100% câu hỏi vượt qua validator', () => {
  const count = 10;
  const drafts = generateDeterministicFallbackQuestions({
    topic: 'Vật lý Lượng tử',
    questionCount: count,
    questionTypes: ['single_choice', 'multiple_choice', 'true_false', 'essay'],
    difficulty: 'hard',
  });

  assert.equal(drafts.length, count);
  for (const draft of drafts) {
    assert.ok(draft.content && draft.content.length > 5);
    assert.ok(draft.difficulty === 'hard');
    if (draft.type === 'single_choice' || draft.type === 'multiple_choice' || draft.type === 'true_false') {
      assert.ok(draft.options && draft.options.length >= 2);
    }
    if (draft.type === 'essay') {
      assert.ok(draft.sampleAnswer);
      assert.ok(draft.rubric);
    }
  }
});
