import type { Question, Flashcard, DifficultyLevel } from '../types';

const API_KEY_STORAGE = 'd2p_gemini_api_key';

// Lấy & lưu Gemini API Key
export const getStoredApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE) || '';
};

export const saveStoredApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
};

// Kiểm tra tính hợp lệ của API Key
export const testGeminiApiKey = async (apiKey: string): Promise<{ valid: boolean; message: string }> => {
  if (!apiKey.trim()) {
    return { valid: false, message: 'Vui lòng nhập API Key.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Trả lời đúng 1 chữ: OK' }] }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}`;
      return { valid: false, message: `Kết nối thất bại: ${errMsg}` };
    }

    return { valid: true, message: 'Kết nối thành công! API Key của Google Gemini hợp lệ.' };
  } catch (err: any) {
    return { valid: false, message: `Không thể kết nối máy chủ: ${err.message || err}` };
  }
};

// Sinh câu hỏi trắc nghiệm từ Gemini API
export const generateQuizWithGemini = async (
  content: string,
  count: number,
  difficulty: DifficultyLevel,
  apiKey: string
): Promise<Question[]> => {
  const difficultyPrompt = {
    easy: 'mức độ dễ, tập trung vào định nghĩa cơ bản và nhận biết',
    medium: 'mức độ trung bình, yêu cầu hiểu và phân biệt khái niệm',
    hard: 'mức độ khó, yêu cầu phân tích sâu, suy luận và tình huống thực tế',
  }[difficulty];

  const prompt = `
Bạn là chuyên gia sư phạm và khảo thí đại học. Hãy phân tích nội dung học tập sau đây và tạo chính xác ${count} câu hỏi trắc nghiệm 4 đáp án (A, B, C, D) ở ${difficultyPrompt}.

NỘI DUNG TÀI LIỆU:
"""
${content.slice(0, 15000)}
"""

YÊU CẦU:
1. Mỗi câu hỏi phải có đúng 4 phương án lựa chọn, không có phương án kiểu "Tất cả đều đúng" hoặc "Tất cả đều sai".
2. Chỉ có duy nhất 1 đáp án đúng (chỉ số 0, 1, 2 hoặc 3 tương ứng A, B, C, D).
3. Có lời giải thích chi tiết, thuyết phục bằng tiếng Việt vì sao đáp án đó đúng và phân tích ngắn các bẫy.
4. Trả về ĐÚNG định dạng JSON hợp lệ (không kèm markdown ngoài khối json) theo schema sau:
[
  {
    "id": "q1",
    "question": "Nội dung câu hỏi...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswerIndex": 0,
    "explanation": "Lời giải thích chi tiết..."
  }
]
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Lỗi Gemini API (${response.status})`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Không nhận được dữ liệu phản hồi từ AI.');
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Dữ liệu JSON sinh ra không đúng cấu trúc mảng câu hỏi.');
  }

  return parsed.map((item, idx) => ({
    id: `gemini-q-${Date.now()}-${idx + 1}`,
    question: item.question,
    options: item.options,
    correctAnswerIndex: item.correctAnswerIndex ?? 0,
    explanation: item.explanation || 'Không có lời giải thích.',
  }));
};

// Sinh Flashcards từ Gemini API
export const generateFlashcardsWithGemini = async (
  content: string,
  count: number,
  apiKey: string
): Promise<Flashcard[]> => {
  const prompt = `
Dựa vào nội dung tài liệu sau, hãy trích xuất ${count} thẻ ghi nhớ Flashcard gồm các thuật ngữ, khái niệm, công thức hoặc câu hỏi then chốt.

NỘI DUNG:
"""
${content.slice(0, 15000)}
"""

Trả về JSON mảng theo mẫu:
[
  {
    "front": "Thuật ngữ / Khái niệm hoặc Câu hỏi mặt trước",
    "back": "Định nghĩa / Lời giải thích ngắn gọn, dễ nhớ mặt sau",
    "example": "Ví dụ minh họa thực tế (nếu có)"
  }
]
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Lỗi khi gọi Gemini API để tạo flashcards.');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(text);

  return parsed.map((item: any, idx: number) => ({
    id: `gemini-fc-${Date.now()}-${idx + 1}`,
    front: item.front,
    back: item.back,
    example: item.example,
    status: 'new' as const,
  }));
};

// Engine sinh câu hỏi thông minh nội bộ (dựa trên phân tích nội dung thực tế khi không có Gemini Key)
export const generateOfflineQuizFromText = (
  title: string,
  rawContent: string,
  count: number,
  difficulty: DifficultyLevel
): Question[] => {
  const lines = rawContent
    .split(/\n|\. /)
    .map((l) => l.trim())
    .filter((l) => l.length > 25);

  const questions: Question[] = [];

  // Trích xuất các ý tưởng từ văn bản
  for (let i = 0; i < count; i++) {
    const sourceLine = lines[i % Math.max(1, lines.length)] || `Nội dung cốt lõi của tài liệu ${title}`;
    const cleanSentence = sourceLine.replace(/^[-*•\d.]+\s*/, '');

    const diffBadge = difficulty === 'easy' ? 'Định nghĩa' : difficulty === 'medium' ? 'Vận dụng' : 'Phân tích nâng cao';

    questions.push({
      id: `smart-q-${Date.now()}-${i + 1}`,
      question: `[${diffBadge}] Khẳng định nào sau đây phản ánh chính xác nhất luận điểm: "${cleanSentence.slice(0, 110)}${cleanSentence.length > 110 ? '...' : ''}"?`,
      options: [
        cleanSentence,
        `Trái ngược với nội dung trên, tài liệu xem nhẹ yếu tố này trong thực tiễn.`,
        `Chỉ áp dụng trong một số trường hợp ngoại lệ hiếm gặp.`,
        `Không có mối liên hệ mật thiết nào với các nguyên tắc đã đề cập.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Dựa vào tài liệu "${title}": "${cleanSentence}". Đây là kiến thức trọng tâm cần nắm vững để trả lời chính xác.`,
    });
  }

  return questions;
};
