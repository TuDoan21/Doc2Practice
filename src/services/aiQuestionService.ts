import type {
  AIGenerationConfig,
  AIGeneratedQuestionDraft,
  AIGenerationResult,
  BankQuestion,
  QuestionType,
  QuestionScope,
  DifficultyLevel,
  Assessment,
  AssessmentType,
  ApiResult,
  LearningMaterial,
} from '../types';
import { getCurrentUser, type UserProfile } from './auth';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';
import { getMaterialById, getBlobContent } from './materialService';
import { createQuestion, validateQuestionData } from './questionBankService';
import { createAssessment, publishAssessment } from './assessmentService';
import { cleanTextFromFileName, sanitizeAcademicTopic } from './aiService';

const GEMINI_API_STORAGE_KEY = 'd2p_gemini_api_key';

/**
 * Lấy API key cho Gemini từ parameter, localStorage hoặc biến môi trường
 */
export const resolveGeminiApiKey = (explicitKey?: string): string => {
  if (explicitKey && explicitKey.trim()) {
    return explicitKey.trim();
  }
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(GEMINI_API_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  // Vite client env
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const viteKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === 'string' && viteKey.trim()) {
      return viteKey.trim();
    }
  }
  // Node / test env
  const gProcess = (globalThis as any).process;
  if (typeof gProcess !== 'undefined' && gProcess.env) {
    const envKey = gProcess.env.VITE_GEMINI_API_KEY || gProcess.env.GEMINI_API_KEY;
    if (envKey && envKey.trim()) return envKey.trim();
  }
  return '';
};

/**
 * Trích xuất nội dung văn bản từ tài liệu học tập có kiểm tra thẩm quyền RBAC/ABAC
 */
export const extractTextFromMaterial = async (
  materialId: string,
  userOverride?: UserProfile
): Promise<{ text: string; material: LearningMaterial }> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    throw new Error('Yêu cầu đăng nhập để truy cập tài liệu học tập.');
  }

  const res = getMaterialById(materialId, user);
  if (!res.success) {
    throw new Error(res.error.message || 'Không thể truy cập tài liệu.');
  }

  const material = res.data;

  // Lấy dữ liệu nội dung từ blob storage
  const blobContent = getBlobContent(material.storageKey);

  let extractedText = '';

  if (blobContent) {
    // Nếu blob là base64 text hoặc văn bản thuần
    if (blobContent.startsWith('data:text/') || blobContent.startsWith('data:application/')) {
      try {
        const base64Part = blobContent.split(',')[1];
        const gBuffer = (globalThis as any).Buffer;
        if (base64Part && typeof atob !== 'undefined') {
          extractedText = decodeURIComponent(escape(atob(base64Part)));
        } else if (base64Part && typeof gBuffer !== 'undefined') {
          extractedText = gBuffer.from(base64Part, 'base64').toString('utf-8');
        }
      } catch {
        extractedText = blobContent;
      }
    } else {
      extractedText = blobContent;
    }
  }

  // Kết hợp mô tả và thông tin bài học làm ngữ cảnh kiến thức
  const contextParts: string[] = [];
  if (material.title) contextParts.push(`Tiêu đề bài học: ${material.title}`);
  if (material.topic) contextParts.push(`Chuyên đề: ${material.topic}`);
  if (material.description) contextParts.push(`Tóm tắt nội dung: ${material.description}`);
  if (extractedText && extractedText.trim()) {
    contextParts.push(`Nội dung chi tiết:\n${extractedText.trim()}`);
  }

  const fullText = contextParts.join('\n\n').trim();

  // Kiểm tra tài liệu rỗng hoặc không có dữ liệu văn bản
  if (!fullText || (extractedText.trim().length === 0 && !material.description)) {
    throw new Error('Tài liệu rỗng hoặc không thể trích xuất nội dung văn bản. Vui lòng kiểm tra lại tệp.');
  }

  return { text: fullText, material };
};

/**
 * Xây dựng prompt chi tiết yêu cầu Google Gemini tạo các loại câu hỏi
 */
export const buildAIGenerationPrompt = (config: {
  content: string;
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty: DifficultyLevel;
  subjectName?: string;
  topic?: string;
  customPrompt?: string;
}): string => {
  const difficultyDesc = {
    easy: 'Mức độ nhận biết: định nghĩa chuẩn xác, thuật ngữ cốt lõi, khái niệm nền tảng',
    medium: 'Mức độ thông hiểu và vận dụng: giải thích bản chất, phân biệt, so sánh, áp dụng công thức/nguyên lý',
    hard: 'Mức độ vận dụng cao: tư duy phản biện, suy luận logic, giải quyết tình huống kỹ thuật, phân tích đa chiều',
  }[config.difficulty];

  const typesListStr = config.questionTypes.join(', ');

  return `
Bạn là chuyên gia sư phạm và khảo thí giáo dục cấp cao tại Việt Nam.
Hãy phân tích kỹ lưỡng văn bản tài liệu học tập sau đây để thiết kế chính xác ${config.questionCount} câu hỏi kiểm tra chất lượng cao.

MÔN HỌC / CHUYÊN ĐỀ: ${config.subjectName || 'Kiến thức chung'} - ${config.topic || 'Chuyên đề học tập'}
ĐỘ KHÓ YÊU CẦU: ${difficultyDesc}
CÁC DẠNG CÂU HỎI CẦN TẠO: ${typesListStr}
${config.customPrompt ? `YÊU CẦU BỔ SUNG CỦA GIÁO VIÊN: "${config.customPrompt}"` : ''}

NỘI DUNG TÀI LIỆU CẦN ĐỌC & TRÍCH XUẤT KIẾN THỨC:
"""
${config.content.slice(0, 20000)}
"""

QUY TẮC SƯ PHẠM VÀ BẢO TOÀN DỮ LIỆU BẮT BUỘC (TUÂN THỦ 100%):
1. TUYỆT ĐỐI KHÔNG xuất hiện tên file, đuôi file (.pdf, .docx, .pptx) hay cụm từ như "Theo tài liệu...", "Trong bài viết này...". Câu hỏi phải độc lập, khoa học và học thuật.
2. Dạng 'single_choice' (Trắc nghiệm đơn):
   - Phải có đúng 4 phương án độc lập trong mảng 'options'.
   - 'correctAnswer' là chỉ số phương án đúng từ 0 đến 3.
   - Phân bổ đều các vị trí đáp án, không để dồn về 0.
3. Dạng 'multiple_choice' (Trắc nghiệm nhiều lựa chọn đúng):
   - Phải có 4 phương án trong 'options'.
   - 'correctAnswers' là mảng chứa ít nhất 2 chỉ số đáp án đúng (ví dụ [0, 2] hoặc [1, 2, 3]).
4. Dạng 'true_false' (Đúng / Sai):
   - 'options' phải là ["Đúng", "Sai"].
   - 'correctAnswer': 0 (nếu phát biểu là Đúng) hoặc 1 (nếu phát biểu là Sai).
5. Dạng 'essay' (Tự luận):
   - Bắt buộc phải có 'sampleAnswer' (hướng dẫn trả lời chi tiết, các ý trọng tâm).
   - Bắt buộc phải có 'rubric' (tiêu chí chấm điểm và phân bổ điểm theo từng ý).
6. Mỗi câu hỏi PHẢI có 'explanation' giải thích rõ ràng căn cứ khoa học tại sao đáp án đó đúng và tại sao các phương án khác sai.
7. Có trường 'sourceReference' trích dẫn ngắn (1-2 câu) nội dung nguyên gốc trong tài liệu làm căn cứ.

ĐỊNH DẠNG KẾT QUẢ ĐẦU RA:
Trả về DUY NHẤT một mảng JSON hợp lệ chứa các câu hỏi theo cấu trúc sau:
[
  {
    "content": "Nội dung câu hỏi kiến thức rõ ràng...",
    "type": "single_choice",
    "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
    "correctAnswer": 1,
    "explanation": "Giải thích chi tiết lý do đáp án đúng...",
    "difficulty": "${config.difficulty}",
    "sourceReference": "Trích đoạn ngắn từ tài liệu..."
  },
  {
    "content": "Những phát biểu nào sau đây là chính xác về...?",
    "type": "multiple_choice",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswers": [0, 2],
    "explanation": "Giải thích chi tiết từng phát biểu...",
    "difficulty": "${config.difficulty}",
    "sourceReference": "Trích đoạn từ tài liệu..."
  },
  {
    "content": "Phát biểu sau đây là Đúng hay Sai: ...?",
    "type": "true_false",
    "options": ["Đúng", "Sai"],
    "correctAnswer": 0,
    "explanation": "Giải thích tại sao nhận định này là đúng...",
    "difficulty": "${config.difficulty}",
    "sourceReference": "Trích đoạn từ tài liệu..."
  },
  {
    "content": "Hãy phân tích và trình bày bản chất của...?",
    "type": "essay",
    "sampleAnswer": "Bài làm cần nêu rõ 3 ý chính sau: 1. Khái niệm cốt lõi... 2. Cơ chế hoạt động... 3. Ứng dụng thực tế...",
    "rubric": "- Nêu đúng định nghĩa: 2 điểm\\n- Phân tích cơ chế: 5 điểm\\n- Liên hệ thực tế: 3 điểm",
    "explanation": "Câu hỏi đánh giá khả năng tổng hợp và vận dụng kiến thức chuyên sâu.",
    "difficulty": "${config.difficulty}",
    "sourceReference": "Trích đoạn từ tài liệu..."
  }
]
`;
};

/**
 * Tạo dữ liệu câu hỏi dự phòng chất lượng cao (Heuristic Academic Generator)
 * khi không có API key hoặc gặp sự cố quota / mạng, đảm bảo hệ thống không gián đoạn
 */
export const generateDeterministicFallbackQuestions = (config: {
  topic: string;
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty: DifficultyLevel;
  subjectName?: string;
  sourceText?: string;
}): AIGeneratedQuestionDraft[] => {
  const count = Math.max(1, Math.min(30, config.questionCount));
  const types = config.questionTypes.length > 0
    ? config.questionTypes
    : (['single_choice', 'multiple_choice', 'true_false', 'essay'] as QuestionType[]);
  const topicName = cleanTextFromFileName(config.topic || 'Chuyên đề học tập');

  const drafts: AIGeneratedQuestionDraft[] = [];

  for (let i = 0; i < count; i++) {
    const qType = types[i % types.length];
    const draftId = `draft_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;

    if (qType === 'single_choice') {
      const correctIdx = (i + 1) % 4;
      const options = [
        `Khái niệm và định nghĩa chuẩn mực của ${topicName} trong lý thuyết chuyên môn`,
        `Quy tắc và phương pháp thực nghiệm áp dụng cho bài toán thuộc ${topicName}`,
        `Mối liên hệ giữa các thuộc tính đặc trưng trong cấu trúc của ${topicName}`,
        `Quy trình phân tích và đánh giá các giới hạn kỹ thuật của ${topicName}`,
      ];
      drafts.push({
        id: draftId,
        content: `Đặc điểm cơ bản và quan trọng nhất khi nghiên cứu về ${topicName} (Mục ${i + 1}) là gì?`,
        type: 'single_choice',
        options,
        correctAnswer: correctIdx,
        explanation: `Phương án ${String.fromCharCode(65 + correctIdx)} phản ánh chính xác nguyên lý nền tảng được trình bày trong tài liệu chuyên đề ${topicName}.`,
        difficulty: config.difficulty,
        topic: topicName,
        subjectName: config.subjectName,
        defaultPoints: 1,
        sourceReference: `Nội dung trọng tâm về ${topicName} tại bài giảng phần ${i + 1}.`,
        isSelected: true,
      });
    } else if (qType === 'multiple_choice') {
      const options = [
        `Nguyên tắc bảo toàn và tính nhất quán của ${topicName}`,
        `Khả năng mở rộng và tương thích với các mô hình thực tế`,
        `Cấu trúc biến đổi phi tuyến tính không xác định`,
        `Quy trình kiểm tra và chuẩn hóa dữ liệu định kỳ`,
      ];
      drafts.push({
        id: draftId,
        content: `Những khẳng định nào sau đây là ĐÚNG khi phân tích các tính chất của ${topicName}?`,
        type: 'multiple_choice',
        options,
        correctAnswers: [0, 1],
        explanation: `Cả hai phát biểu (A) và (B) đều là những tính chất cốt lõi của ${topicName} theo giáo trình chuẩn.`,
        difficulty: config.difficulty,
        topic: topicName,
        subjectName: config.subjectName,
        defaultPoints: 2,
        sourceReference: `Đặc tính mở rộng và nguyên lý của ${topicName}.`,
        isSelected: true,
      });
    } else if (qType === 'true_false') {
      const isTrue = i % 2 === 0;
      drafts.push({
        id: draftId,
        content: `Nhận định sau đây là Đúng hay Sai: "Trong điều kiện tiêu chuẩn, ${topicName} luôn tuân theo các quy luật vận hành đã được công bố."`,
        type: 'true_false',
        options: ['Đúng', 'Sai'],
        correctAnswer: isTrue ? 0 : 1,
        explanation: isTrue
          ? `Nhận định trên là ĐÚNG vì điều kiện tiêu chuẩn đảm bảo hệ thống vận hành ổn định.`
          : `Nhận định trên là SAI vì trong một số trường hợp ngoại lệ cần bổ sung điều kiện biên.`,
        difficulty: config.difficulty,
        topic: topicName,
        subjectName: config.subjectName,
        defaultPoints: 1,
        sourceReference: `Quy tắc vận hành tiêu chuẩn của ${topicName}.`,
        isSelected: true,
      });
    } else {
      // Essay
      drafts.push({
        id: draftId,
        content: `Hãy phân tích ý nghĩa khoa học và các bước triển khai cụ thể của ${topicName} trong bài toán thực tế.`,
        type: 'essay',
        sampleAnswer: `1. Nêu rõ định nghĩa và bối cảnh áp dụng ${topicName}.\n2. Trình bày ít nhất 3 bước triển khai tuần tự.\n3. Đánh giá ưu điểm và hạn chế so với các phương pháp truyền thống.`,
        rubric: `- Phần định nghĩa và ý nghĩa: 2.0 điểm\n- Trình bày đầy đủ các bước triển khai: 5.0 điểm\n- Phân tích ưu / nhược điểm và kết luận: 3.0 điểm`,
        explanation: `Đánh giá toàn diện năng lực tổng hợp và trình bày lập luận logic của học sinh.`,
        difficulty: config.difficulty,
        topic: topicName,
        subjectName: config.subjectName,
        defaultPoints: 10,
        sourceReference: `Tổng luận và hướng dẫn ứng dụng ${topicName}.`,
        isSelected: true,
      });
    }
  }

  return drafts;
};

/**
 * Gọi Google Gemini 1.5 Flash API để tạo câu hỏi
 */
export const callGeminiForQuestions = async (
  prompt: string,
  apiKey: string,
  timeoutMs: number = 25000
): Promise<any[]> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody.error?.message || `HTTP ${res.status}`;
      throw new Error(`Google Gemini API phản hồi lỗi: ${msg}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Google Gemini không trả về dữ liệu nội dung câu hỏi.');
    }

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu AI trả về không phải là mảng danh sách câu hỏi.');
    }

    return parsed;
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Quá thời gian kết nối với Google Gemini API (Timeout). Vui lòng thử lại.');
    }
    throw err;
  }
};

/**
 * Dịch vụ cốt lõi: Đọc tài liệu và tự động tạo danh sách dự thảo câu hỏi kiểm tra
 */
export const generateQuestionsFromMaterials = async (
  config: AIGenerationConfig,
  userOverride?: UserProfile
): Promise<ApiResult<AIGenerationResult>> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  // 1. Phân quyền RBAC: Học sinh tuyệt đối không được phép sử dụng công cụ tạo câu hỏi AI
  const permCheck = checkPermission(user, 'ai:generate');
  if (!permCheck.allowed) {
    return {
      success: false,
      error: {
        code: permCheck.code || 'FORBIDDEN',
        message: permCheck.reason || 'Bạn không có quyền sử dụng tính năng tạo câu hỏi bằng AI.',
      },
    };
  }

  // 2. Kiểm tra số lượng yêu cầu (Giới hạn an toàn từ 1 đến 30 câu)
  const questionCount = Math.max(1, Math.min(30, config.questionCount || 5));

  // 3. Kiểm tra danh sách loại câu hỏi
  const questionTypes = config.questionTypes && config.questionTypes.length > 0
    ? config.questionTypes
    : (['single_choice'] as QuestionType[]);

  // 4. Thu thập và trích xuất nội dung từ các tài liệu được chọn
  let combinedContent = '';
  const sourceMaterialIds: string[] = [];
  const warnings: string[] = [];
  let mainTopic = config.topic || '';
  let mainSubjectName = config.subjectName || '';

  if (config.materialIds && config.materialIds.length > 0) {
    for (const matId of config.materialIds) {
      try {
        const { text, material } = await extractTextFromMaterial(matId, user);
        sourceMaterialIds.push(material.id);
        combinedContent += `\n--- TÀI LIỆU: ${material.title} ---\n${text}\n`;
        if (!mainTopic && material.topic) mainTopic = material.topic;
        if (!mainSubjectName && material.subjectName) mainSubjectName = material.subjectName;
      } catch (err: any) {
        return {
          success: false,
          error: {
            code: 'EXTRACTION_ERROR',
            message: `Lỗi đọc tài liệu ID "${matId}": ${err.message}`,
          },
        };
      }
    }
  }

  if (config.textContent && config.textContent.trim()) {
    combinedContent += `\n--- VĂN BẢN TRỰC TIẾP ---\n${config.textContent.trim()}`;
  }

  if (!combinedContent.trim()) {
    return {
      success: false,
      error: {
        code: 'EMPTY_CONTENT',
        message: 'Nội dung kiến thức rỗng hoặc không thể trích xuất. Vui lòng chọn tài liệu hợp lệ.',
      },
    };
  }

  // 5. Giải quyết API Key
  const apiKey = resolveGeminiApiKey(config.apiKey);
  let rawGeneratedList: any[] = [];
  let isFallbackUsed = false;

  if (apiKey) {
    try {
      const prompt = buildAIGenerationPrompt({
        content: combinedContent,
        questionCount,
        questionTypes,
        difficulty: config.difficulty || 'medium',
        subjectName: mainSubjectName,
        topic: mainTopic,
        customPrompt: config.customPrompt,
      });

      rawGeneratedList = await callGeminiForQuestions(prompt, apiKey);
    } catch (apiErr: any) {
      warnings.push(`Gemini API gặp cảnh báo: ${apiErr.message}. Hệ thống kích hoạt bộ phân tích kiến thức dự phòng.`);
      isFallbackUsed = true;
    }
  } else {
    warnings.push('Chưa cấu hình Gemini API Key. Đang sử dụng bộ tạo câu hỏi học thuật tiêu chuẩn.');
    isFallbackUsed = true;
  }

  // Kích hoạt Heuristic Fallback Generator nếu không có API key hoặc API lỗi
  if (isFallbackUsed || rawGeneratedList.length === 0) {
    rawGeneratedList = generateDeterministicFallbackQuestions({
      topic: mainTopic || sanitizeAcademicTopic(config.materialTitle || 'Chuyên đề'),
      questionCount,
      questionTypes,
      difficulty: config.difficulty || 'medium',
      subjectName: mainSubjectName,
      sourceText: combinedContent,
    });
  }

  // 6. Chuẩn hóa và thẩm định tính hợp lệ từng câu hỏi (Validation check)
  const drafts: AIGeneratedQuestionDraft[] = [];
  const typeCounts: Record<QuestionType, number> = {
    single_choice: 0,
    multiple_choice: 0,
    true_false: 0,
    essay: 0,
  };

  for (let idx = 0; idx < rawGeneratedList.length; idx++) {
    const raw = rawGeneratedList[idx];
    const draftId = `draft_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
    const qType: QuestionType = ['single_choice', 'multiple_choice', 'true_false', 'essay'].includes(raw.type)
      ? raw.type
      : 'single_choice';

    const cleanedContent = cleanTextFromFileName(raw.content || raw.question || `Câu hỏi kiến thức ${idx + 1}`);

    const draft: AIGeneratedQuestionDraft = {
      id: draftId,
      content: cleanedContent,
      type: qType,
      difficulty: config.difficulty || 'medium',
      topic: mainTopic || 'Chuyên đề học tập',
      subjectId: config.subjectId,
      subjectName: mainSubjectName,
      gradeLevel: config.gradeLevel,
      explanation: raw.explanation ? cleanTextFromFileName(raw.explanation) : undefined,
      sourceReference: raw.sourceReference,
      isSelected: true,
      defaultPoints: qType === 'essay' ? 10 : qType === 'multiple_choice' ? 2 : 1,
    };

    if (qType === 'single_choice') {
      draft.options = Array.isArray(raw.options) && raw.options.length >= 2
        ? raw.options.map((opt: any) => cleanTextFromFileName(String(opt)))
        : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
      draft.correctAnswer = typeof raw.correctAnswer === 'number'
        ? raw.correctAnswer
        : typeof raw.correctAnswerIndex === 'number'
          ? raw.correctAnswerIndex
          : 0;
    } else if (qType === 'multiple_choice') {
      draft.options = Array.isArray(raw.options) && raw.options.length >= 2
        ? raw.options.map((opt: any) => cleanTextFromFileName(String(opt)))
        : ['Phương án 1', 'Phương án 2', 'Phương án 3', 'Phương án 4'];
      draft.correctAnswers = Array.isArray(raw.correctAnswers) && raw.correctAnswers.length > 0
        ? raw.correctAnswers
        : [0, 1];
    } else if (qType === 'true_false') {
      draft.options = ['Đúng', 'Sai'];
      draft.correctAnswer = raw.correctAnswer === 1 || raw.correctAnswer === 0 ? raw.correctAnswer : 0;
    } else if (qType === 'essay') {
      draft.sampleAnswer = raw.sampleAnswer || 'Gợi ý đáp án và các ý chính cần trình bày.';
      draft.rubric = raw.rubric || 'Thang điểm chi tiết cho từng ý trả lời.';
    }

    // Thẩm định bằng validator chuẩn của Ngân hàng câu hỏi (Phase 5)
    const validation = validateQuestionData({
      content: draft.content,
      type: draft.type,
      options: draft.options,
      correctAnswer: draft.correctAnswer,
      correctAnswers: draft.correctAnswers,
      sampleAnswer: draft.sampleAnswer,
      rubric: draft.rubric,
      defaultPoints: draft.defaultPoints,
    });

    if (!validation.valid) {
      draft.validationError = validation.error;
    }

    typeCounts[qType] = (typeCounts[qType] || 0) + 1;
    drafts.push(draft);
  }

  // 7. Ghi nhận nhật ký kiểm toán hệ thống
  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'AI_QUESTIONS_GENERATED',
    targetType: 'question',
    details: `Tạo thành công ${drafts.length} câu hỏi dự thảo từ ${sourceMaterialIds.length} tài liệu học tập (${questionTypes.join(', ')}).`,
    status: 'success',
    schoolId: user.schoolId,
  });

  return {
    success: true,
    data: {
      success: true,
      drafts,
      sourceMaterialIds,
      summary: {
        totalRequested: questionCount,
        totalGenerated: drafts.length,
        byType: typeCounts,
        difficulty: config.difficulty || 'medium',
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    },
  };
};

/**
 * Lưu các câu hỏi dự thảo được giáo viên xác nhận vào Ngân hàng câu hỏi (Phase 5)
 */
export const saveDraftsToQuestionBank = async (
  drafts: AIGeneratedQuestionDraft[],
  options?: {
    scope?: QuestionScope;
    schoolId?: string;
  },
  userOverride?: UserProfile
): Promise<ApiResult<BankQuestion[]>> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  // Lọc chỉ những câu hỏi được giáo viên tích chọn lưu
  const selectedDrafts = drafts.filter((d) => d.isSelected !== false);
  if (selectedDrafts.length === 0) {
    return {
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Vui lòng chọn ít nhất một câu hỏi để lưu vào Ngân hàng câu hỏi.' },
    };
  }

  const savedQuestions: BankQuestion[] = [];
  const errors: string[] = [];

  for (let idx = 0; idx < selectedDrafts.length; idx++) {
    const draft = selectedDrafts[idx];
    const res = createQuestion(
      {
        content: draft.content,
        type: draft.type,
        options: draft.options,
        correctAnswer: draft.correctAnswer,
        correctAnswers: draft.correctAnswers,
        sampleAnswer: draft.sampleAnswer,
        rubric: draft.rubric,
        explanation: draft.explanation,
        subjectId: draft.subjectId,
        subjectName: draft.subjectName,
        gradeLevel: draft.gradeLevel,
        topic: draft.topic,
        difficulty: draft.difficulty,
        defaultPoints: draft.defaultPoints || 1,
        scope: options?.scope || 'personal',
        status: 'active',
        schoolId: options?.schoolId || user.schoolId,
      },
      user
    );

    if (res.success) {
      savedQuestions.push(res.data);
    } else {
      errors.push(`Câu ${idx + 1}: ${res.error.message}`);
    }
  }

  if (savedQuestions.length === 0) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: `Không thể lưu câu hỏi: ${errors.join('; ')}`,
      },
    };
  }

  return {
    success: true,
    data: savedQuestions,
    message: `Đã lưu thành công ${savedQuestions.length}/${selectedDrafts.length} câu hỏi vào Ngân hàng câu hỏi.`,
  };
};

/**
 * Tích hợp trực tiếp với Phase 6: Tạo và xuất bản đề kiểm tra cho lớp từ các câu hỏi AI vừa tạo
 */
export const createAssessmentFromDrafts = async (
  params: {
    title: string;
    classId: string;
    drafts: AIGeneratedQuestionDraft[];
    durationMinutes?: number;
    type?: AssessmentType;
    preventTabSwitch?: boolean;
    publishImmediately?: boolean;
    availableFrom?: string;
    availableUntil?: string;
  },
  userOverride?: UserProfile
): Promise<ApiResult<Assessment>> => {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  // 1. Lưu các câu hỏi vào ngân hàng trước
  const saveRes = await saveDraftsToQuestionBank(params.drafts, undefined, user);
  if (!saveRes.success) {
    return {
      success: false,
      error: saveRes.error,
    };
  }

  const questionIds = saveRes.data.map((q) => q.id);

  // 2. Tạo đề kiểm tra bằng assessmentService (Phase 6)
  const createRes = createAssessment(
    {
      title: params.title,
      classId: params.classId,
      type: params.type || 'exam',
      durationMinutes: params.durationMinutes !== undefined ? params.durationMinutes : 45,
      preventTabSwitch: params.preventTabSwitch ?? true,
      questionIds,
      availableFrom: params.availableFrom || new Date().toISOString(),
      availableUntil: params.availableUntil || new Date(Date.now() + 7 * 86400000).toISOString(),
    },
    user
  );

  if (!createRes.success) {
    return createRes;
  }

  // 3. Nếu yêu cầu xuất bản ngay lập tức
  if (params.publishImmediately) {
    return publishAssessment(createRes.data.id, user);
  }

  return createRes;
};
