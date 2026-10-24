import type { Question, Flashcard, DifficultyLevel } from '../types';

const API_KEY_STORAGE = 'd2p_gemini_api_key';

// Lấy & lưu Gemini API Key
export const getStoredApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE) || '';
};

export const saveStoredApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
};

// Làm sạch tên chủ đề học thuật: bỏ đuôi file, bỏ tiền tố tài liệu, chuyển dấu gạch thành khoảng trắng
export const sanitizeAcademicTopic = (raw: string): string => {
  if (!raw) return 'Chuyên đề học tập';
  return raw
    .replace(/\.[a-zA-Z0-9]{2,5}$/i, '') // bỏ đuôi .pdf, .docx, .pptx...
    .replace(/^(giao_trinh|slide|thuyet_trinh|bai_giang|de_cuong|tai_lieu|chuyen_de|chuong_\d+|chapter_\d+|bai_\d+)[_\-\s]+/gi, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Loại bỏ hoàn toàn dấu vết tên file, đuôi file và các cụm từ tham chiếu tệp thừa
export const cleanTextFromFileName = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\b[\w-]+\.(pdf|docx|doc|pptx|ppt|txt|md|xlsx)\b/gi, '')
    .replace(/theo tài liệu\s+["']?[^,"'.;:]+["']?[,:]?/gi, '')
    .replace(/dựa vào tài liệu\s+["']?[^,"'.;:]+["']?[,:]?/gi, '')
    .replace(/trong tài liệu\s+["']?[^,"'.;:]+["']?[,:]?/gi, '')
    .replace(/tài liệu môn học:\s*/gi, '')
    .replace(/\[câu\s*\d+\]\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

// Hoán đổi ngẫu nhiên vị trí đáp án đúng để không bị dồn về đáp án A
const shuffleOptions = (
  correctOptionText: string,
  distractors: string[],
  targetIndex?: number
): { options: string[]; correctIndex: number } => {
  const chosenIndex = typeof targetIndex === 'number' ? targetIndex % 4 : Math.floor(Math.random() * 4);
  const options = [...distractors.slice(0, 3)];
  while (options.length < 3) {
    options.push('Phương án thay thế bổ sung');
  }
  options.splice(chosenIndex, 0, correctOptionText);
  return { options, correctIndex: chosenIndex };
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
    easy: 'mức độ dễ: tập trung vào định nghĩa chuẩn xác, nhận diện thuật ngữ và khái niệm căn bản',
    medium: 'mức độ trung bình: yêu cầu hiểu sâu, so sánh, phân biệt khái niệm và áp dụng nguyên lý',
    hard: 'mức độ khó: yêu cầu tư duy phân tích, suy luận logic, giải quyết tình huống kỹ thuật thực tế và tối ưu hóa',
  }[difficulty];

  const prompt = `
Bạn là chuyên gia sư phạm và khảo thí cấp cao. Hãy phân tích nội dung kiến thức sau đây để thiết kế chính xác ${count} câu hỏi trắc nghiệm 4 đáp án (A, B, C, D) ở ${difficultyPrompt}.

NỘI DUNG HỌC TẬP:
"""
${content.slice(0, 15000)}
"""

QUY TẮC CẤM NGHIÊM NGẶT (RẤT QUAN TRỌNG):
1. TUYỆT ĐỐI KHÔNG chứa tên tệp hoặc phần mở rộng tệp (.pdf, .docx, .pptx, .ppt, .txt, v.v.) trong nội dung câu hỏi, phương án lựa chọn hoặc phần giải thích.
2. TUYỆT ĐỐI KHÔNG bắt đầu câu hỏi bằng cụm từ như "Theo tài liệu...", "Trong tệp này...", "Tác giả của tài liệu này...". Câu hỏi phải là câu hỏi kiến thức học thuật chuyên nghiệp, độc lập như trong đề thi đại học quốc gia.
3. Mỗi câu hỏi phải có đúng 4 phương án lựa chọn độc lập (A, B, C, D). Không dùng phương án "Tất cả đều đúng" hoặc "Tất cả đều sai".
4. Phân bổ đáp án đúng ngẫu nhiên đều giữa các vị trí 0, 1, 2, 3 (A, B, C, D), TUYỆT ĐỐI KHÔNG được để tất cả đáp án đúng đều là 0 (A).
5. Phần giải thích phải giải thích vì sao đáp án đó chính xác và phân tích ngắn gọn lý do các phương án còn lại là sai/bẫy.

Trả về kết quả ĐÚNG định dạng JSON mảng hợp lệ (không kèm văn bản ngoài JSON):
[
  {
    "question": "Nội dung câu hỏi kiến thức chuyên môn...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswerIndex": 1,
    "explanation": "Giải thích chi tiết nguyên lý..."
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
        temperature: 0.35,
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
    question: cleanTextFromFileName(item.question || `Câu hỏi kiến thức ${idx + 1}`),
    options: Array.isArray(item.options) && item.options.length >= 4
      ? item.options.map((opt: string) => cleanTextFromFileName(opt))
      : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
    correctAnswerIndex: typeof item.correctAnswerIndex === 'number' && item.correctAnswerIndex >= 0 && item.correctAnswerIndex <= 3
      ? item.correctAnswerIndex
      : (idx % 4),
    explanation: cleanTextFromFileName(item.explanation || 'Kiến thức cốt lõi cần ghi nhớ.'),
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
LƯU Ý: TUYỆT ĐỐI KHÔNG nhắc đến tên tệp hoặc phần mở rộng tệp (.pdf, .docx, .pptx) trong thẻ.

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
    front: cleanTextFromFileName(item.front || `Thuật ngữ ${idx + 1}`),
    back: cleanTextFromFileName(item.back || 'Định nghĩa chi tiết'),
    example: item.example ? cleanTextFromFileName(item.example) : undefined,
    status: 'new' as const,
  }));
};

// ==================== CHUYÊN BIỆT HÓA THEO CHỦ ĐỀ HỌC THUẬT (DOMAIN KNOWLEDGE POOLS) ====================

interface QuestionTemplate {
  q: string;
  correct: string;
  distractors: [string, string, string];
  exp: string;
}

// 1. Kho đề Lập trình / Công nghệ phần mềm (React, TypeScript, Web, Backend...)
const devQuestionPool: QuestionTemplate[] = [
  {
    q: 'Trong kiến trúc phần mềm hiện đại, nguyên lý "Immutability" (Tính bất biến của dữ liệu) mang lại lợi ích nổi bật nào?',
    correct: 'Giúp việc dự đoán trạng thái ứng dụng dễ dàng hơn, tránh tác dụng phụ và tối ưu hóa việc phát hiện thay đổi',
    distractors: [
      'Cho phép chỉnh sửa trực tiếp dữ liệu tại bất kỳ vị trí nào trong bộ nhớ để tăng tốc độ ghi',
      'Loại bỏ hoàn toàn sự cần thiết của các trình thu gom rác tự động (Garbage Collector)',
      'Giảm kích thước file thực thi và bỏ qua bước kiểm tra kiểu dữ liệu tĩnh'
    ],
    exp: 'Tính bất biến (Immutability) đảm bảo dữ liệu không bị đột biến bất ngờ ngoài ý muốn, giúp cơ chế phát hiện thay đổi (như Virtual DOM trong React hay Redux) so sánh tham chiếu cực nhanh và tin cậy.'
  },
  {
    q: 'Cơ chế Async/Await trong xử lý bất đồng bộ hoạt động dựa trên nền tảng kỹ thuật nào sau đây?',
    correct: 'Bản chất là cú pháp tinh giản (Syntactic Sugar) bọc quanh Promises và Generator functions',
    distractors: [
      'Một luồng thực thi phần cứng riêng biệt bỏ qua hoàn toàn cơ chế Event Loop',
      'Cơ chế chặn cứng (Blocking I/O) cho đến khi dữ liệu từ máy chủ được truyền về đủ',
      'Một giao thức mạng tầng ứng dụng thay thế cho HTTP/2'
    ],
    exp: 'Async/Await giúp viết mã bất đồng bộ theo phong cách tuần tự, dễ đọc và dễ bắt lỗi bằng try/catch, nhưng bản chất bên dưới vẫn trả về Promise và chạy trên Event Loop.'
  },
  {
    q: 'Để tối ưu hóa thời gian tải trang và trải nghiệm người dùng, kỹ thuật nào sau đây thường được ưu tiên triển khai?',
    correct: 'Áp dụng Code Splitting và Lazy Loading để chỉ tải các module khi người dùng thực sự cần đến',
    distractors: [
      'Gộp toàn bộ thư viện và mã nguồn của toàn bộ trang vào một file JavaScript duy nhất',
      'Chặn kết xuất giao diện cho đến khi toàn bộ tài nguyên hình ảnh được tải xong',
      'Vô hiệu hóa bộ nhớ đệm (Cache-Control: no-store) trên toàn bộ máy chủ CDN'
    ],
    exp: 'Code Splitting chia nhỏ bundle thành các gói nhỏ, kết hợp cùng Lazy Loading giúp giảm đáng kể dung lượng First Contentful Paint (FCP) ban đầu.'
  },
  {
    q: 'Trong thiết kế cơ sở dữ liệu quan hệ, mục đích cốt lõi của việc chuẩn hóa dữ liệu (Normalization) là gì?',
    correct: 'Giảm thiểu sự dư thừa dữ liệu và đảm bảo tính toàn vẹn, tránh các dị thường khi thêm, sửa, xóa',
    distractors: [
      'Tăng dung lượng lưu trữ trên đĩa để cải thiện tốc độ sao lưu dự phòng',
      'Loại bỏ hoàn toàn các khóa chính (Primary Key) để đơn giản hóa bảng',
      'Chuyển đổi dữ liệu có cấu trúc thành văn bản không định dạng'
    ],
    exp: 'Các dạng chuẩn (1NF, 2NF, 3NF) giúp cấu trúc bảng rõ ràng, loại bỏ trùng lặp thông tin và ngăn ngừa các lỗi mất dữ liệu khi cập nhật.'
  },
  {
    q: 'Khi xây dựng RESTful API chuẩn mực, mã trạng thái HTTP (Status Code) nào phản ánh việc tài nguyên được tạo mới thành công?',
    correct: '201 Created',
    distractors: [
      '200 OK (chỉ thể hiện phản hồi thành công chung chung)',
      '204 No Content (thành công nhưng không có nội dung trả về)',
      '202 Accepted (yêu cầu đã được tiếp nhận nhưng chưa xử lý xong)'
    ],
    exp: 'HTTP 201 Created là chuẩn RESTful chỉ định rõ ràng một tài nguyên mới vừa được tạo thành công trên máy chủ kèm URI của tài nguyên đó.'
  }
];

// 2. Kho đề Hệ thống, Mạng máy tính & Hệ điều hành
const sysQuestionPool: QuestionTemplate[] = [
  {
    q: 'Cơ chế bộ nhớ ảo (Virtual Memory) giải quyết bài toán cốt lõi nào trong hệ thống máy tính?',
    correct: 'Cho phép thực thi các tiến trình có kích thước lớn hơn dung lượng bộ nhớ vật lý thực tế (RAM) thông qua phân trang',
    distractors: [
      'Tăng tốc độ xung nhịp CPU bằng cách lưu trữ chỉ lệnh trực tiếp trên ổ cứng',
      'Thay thế hoàn toàn bộ nhớ đệm Cache L1 và L2 trên chip vi xử lý',
      'Loại bỏ sự phân mảnh dữ liệu trên đĩa cứng cơ học'
    ],
    exp: 'Bộ nhớ ảo kết hợp giữa RAM và Swap space/Pagefile trên ổ đĩa, tạo ra không gian địa chỉ tuyến tính liên tục cho mỗi tiến trình hoạt động độc lập và an toàn.'
  },
  {
    q: 'Sự khác biệt căn bản giữa hai giao thức TCP và UDP ở tầng giao vận (Transport Layer) là gì?',
    correct: 'TCP hướng kết nối, đảm bảo truyền tin cậy và đúng thứ tự; UDP phi kết nối, ưu tiên tốc độ và độ trễ thấp',
    distractors: [
      'TCP chỉ dùng cho mạng không dây, còn UDP chỉ truyền trên cáp quang',
      'UDP có cơ chế bắt tay 3 bước (Three-way Handshake) chặt chẽ hơn TCP',
      'TCP không có cơ chế kiểm tra lỗi checksum trong tiêu đề gói tin'
    ],
    exp: 'TCP phù hợp cho Web, Email, File Transfer cần độ tin cậy tuyệt đối; còn UDP tối ưu cho Video Streaming, Gaming, Voice chat nơi chấp nhận mất gói nhẹ nhưng cần độ trễ cực thấp.'
  },
  {
    q: 'Hiện tượng Deadlock (Bế tắc) giữa các tiến trình xảy ra khi hội tụ đủ 4 điều kiện nào sau đây?',
    correct: 'Loại trừ lẫn nhau (Mutual Exclusion), Giữ và chờ (Hold & Wait), Không chiếm dụng (No Preemption), và Chờ đợi vòng tròn (Circular Wait)',
    distractors: [
      'Bộ nhớ RAM bị đầy, đĩa cứng bị ngắt kết nối, CPU quá nhiệt và cáp mạng bị lỏng',
      'Tiến trình bị gián đoạn do người dùng đóng ứng dụng đột ngột',
      'Hệ điều hành chuyển từ chế độ 32-bit sang 64-bit mà không khởi động lại'
    ],
    exp: 'Bốn điều kiện Coffman là điều kiện cần và đủ để xảy ra bế tắc trong việc chia sẻ tài nguyên giữa các tiến trình đồng thời.'
  },
  {
    q: 'Trong mô hình kiến trúc ARM và RISC, đặc điểm thiết kế nào tạo nên lợi thế vượt trội về mặt tiết kiệm năng lượng?',
    correct: 'Tập lệnh thu gọn (Reduced Instruction Set), hầu hết lệnh thực thi trong 1 chu kỳ xung nhịp và kiến trúc Load/Store nghiêm ngặt',
    distractors: [
      'Tích hợp hàng nghìn lệnh phức tạp đa chu kỳ trực tiếp vào phần cứng như kiến trúc CISC',
      'Bỏ qua cơ chế thanh ghi (Registers) và truy xuất thẳng vào bộ nhớ ngoài',
      'Không hỗ trợ tính toán số thực dấu phẩy động'
    ],
    exp: 'Kiến trúc RISC đơn giản hóa phần cứng giải mã lệnh, giảm số lượng bóng bán dẫn tiêu thụ điện, tạo nên hiệu suất trên mỗi watt năng lượng cực cao cho vi điều khiển và thiết bị di động.'
  }
];

// 3. Kho đề Trí tuệ nhân tạo & Khoa học dữ liệu
const aiQuestionPool: QuestionTemplate[] = [
  {
    q: 'Trong quá trình huấn luyện mô hình Machine Learning, hiện tượng Overfitting (Quá khớp) được nhận biết bằng dấu hiệu nào?',
    correct: 'Mô hình đạt độ chính xác rất cao trên tập huấn luyện (Training Set) nhưng sai số lớn trên tập kiểm thử (Test Set)',
    distractors: [
      'Độ chính xác trên cả tập huấn luyện và tập kiểm thử đều rất thấp',
      'Thời gian huấn luyện mô hình kết thúc quá nhanh so với dự kiến',
      'Kích thước file trọng số mô hình bị giảm về 0 KB'
    ],
    exp: 'Overfitting xảy ra khi mô hình học vẹt cả nhiễu của dữ liệu huấn luyện thay vì khái quát hóa các quy luật bản chất, dẫn đến khả năng tổng quát hóa kém trên dữ liệu mới.'
  },
  {
    q: 'Thuật toán Gradient Descent tối ưu hóa các tham số trọng số trong mạng nơ-ron dựa trên nguyên lý nào?',
    correct: 'Cập nhật trọng số ngược hướng với vector đạo hàm riêng của hàm mất mát để tìm điểm cực tiểu',
    distractors: [
      'Lựa chọn ngẫu nhiên các giá trị trọng số mới sau mỗi kỷ nguyên huấn luyện',
      'Giữ cố định tốc độ học (Learning Rate) ở mức tối đa để hội tụ ngay lập tức',
      'Xóa bỏ các tầng ẩn (Hidden Layers) có trọng số âm'
    ],
    exp: 'Gradient Descent tính toán độ dốc (gradient) của hàm mất mát đối với từng tham số và di chuyển từng bước nhỏ ngược chiều độ dốc để đưa sai số về mức tối thiểu.'
  },
  {
    q: 'Phương pháp Regularization (như L1 Lasso, L2 Ridge) được áp dụng nhằm mục đích chính là gì?',
    correct: 'Phạt các trọng số có giá trị quá lớn để giảm độ phức tạp của mô hình và chống hiện tượng Overfitting',
    distractors: [
      'Tăng gấp đôi số lượng mẫu dữ liệu đầu vào mà không cần thu thập thêm',
      'Ép buộc toàn bộ các đặc trưng phải tuân theo phân phối nhị phân',
      'Loại bỏ hoàn toàn các lớp phi tuyến tính trong mạng nơ-ron sâu'
    ],
    exp: 'Bằng cách cộng thêm một lượng phạt vào hàm mục tiêu, Regularization hạn chế mô hình phụ thuộc quá mức vào một vài đặc trưng riêng lẻ, giúp mô hình ổn định và khái quát tốt hơn.'
  }
];

// 4. Kho đề Quản trị kinh doanh & Kinh tế
const bizQuestionPool: QuestionTemplate[] = [
  {
    q: 'Trong quản trị chiến lược, ma trận SWOT hỗ trợ tổ chức phân tích những yếu tố then chốt nào?',
    correct: 'Điểm mạnh và Điểm yếu nội bộ, kết hợp Cơ hội và Thách thức từ môi trường bên ngoài',
    distractors: [
      'Doanh thu theo quý, chi phí marketing, số lượng nhân sự và thời gian họp nội bộ',
      'Chỉ số an toàn lao động và danh mục hàng hóa hết hạn sử dụng',
      'So sánh tiền lương giữa các phòng ban trong cùng một doanh nghiệp'
    ],
    exp: 'SWOT là công cụ kinh điển giúp doanh nghiệp liên kết năng lực cốt lõi nội tại (S-W) với xu thế và biến động của thị trường (O-T) để xây dựng định hướng cạnh tranh.'
  },
  {
    q: 'Khái niệm "Điểm hòa vốn" (Break-even Point) trong phân tích tài chính biểu thị trạng thái nào của doanh nghiệp?',
    correct: 'Mức sản lượng hoặc doanh thu mà tại đó tổng doanh thu vừa đủ bù đắp toàn bộ chi phí (lợi nhuận bằng 0)',
    distractors: [
      'Thời điểm doanh nghiệp đạt tỷ suất lợi nhuận ròng trên vốn chủ sở hữu (ROE) cao nhất',
      'Mức giá bán thấp nhất khiến đối thủ cạnh tranh phải rời bỏ thị trường',
      'Tổng tài sản ngắn hạn bằng đúng tổng nợ dài hạn của công ty'
    ],
    exp: 'Tại điểm hòa vốn, doanh nghiệp không có lãi nhưng cũng không bị lỗ; vượt qua ngưỡng này, mỗi đơn vị sản phẩm bán thêm sẽ bắt đầu đóng góp vào lợi nhuận thuần.'
  },
  {
    q: 'Mục tiêu cốt lõi của chiến lược định vị thương hiệu (Positioning) là gì?',
    correct: 'Tạo dựng một hình ảnh độc đáo, rõ nét và có giá trị khác biệt trong tâm trí khách hàng mục tiêu',
    distractors: [
      'Hạ giá bán sản phẩm xuống mức thấp nhất thị trường bằng mọi giá',
      'Mở rộng tối đa danh mục sản phẩm phục vụ cho mọi phân khúc khách hàng',
      'Sao chép hoàn toàn thông điệp truyền thông của đối thủ dẫn đầu thị trường'
    ],
    exp: 'Định vị trả lời câu hỏi "Tại sao khách hàng nên chọn bạn thay vì đối thủ?", giúp sản phẩm chiếm lĩnh một vị trí nổi bật và bền vững trong nhận thức của người tiêu dùng.'
  }
];

// 5. Kho đề Tổng quát học thuật / Phương pháp luận
const generalQuestionPool: QuestionTemplate[] = [
  {
    q: 'Trong phương pháp luận nghiên cứu khoa học, biến độc lập (Independent Variable) được định nghĩa là gì?',
    correct: 'Yếu tố mà người nghiên cứu chủ động tác động hoặc thay đổi để quan sát ảnh hưởng lên biến khác',
    distractors: [
      'Kết quả đo lường được tạo ra từ sự thay đổi của các yếu tố ngoại cảnh',
      'Đại lượng luôn được giữ cố định nghiêm ngặt trong suốt quá trình thí nghiệm',
      'Sai số ngẫu nhiên phát sinh do thiết bị đo đạc không chuẩn xác'
    ],
    exp: 'Biến độc lập là nguyên nhân được can thiệp để kiểm tra tác động nhân quả đối với biến phụ thuộc (Dependent Variable).'
  },
  {
    q: 'Nguyên lý tư duy "Chia để trị" (Divide and Conquer) mang lại ưu thế căn bản nào khi giải quyết bài toán lớn?',
    correct: 'Phân rã vấn đề phức tạp thành các bài toán con độc lập, giải quyết triệt để từng phần rồi kết hợp kết quả',
    distractors: [
      'Thay đổi toàn bộ cấu trúc hệ thống cùng lúc để tiết kiệm thời gian phân tích',
      'Bỏ qua các trường hợp biên và chỉ tập trung vào kịch bản lý tưởng',
      'Trì hoãn việc kiểm tra cho đến khi toàn bộ quy trình hoàn tất'
    ],
    exp: 'Chia để trị giúp giảm độ phức tạp nhận thức và độ phức tạp tính toán, tạo điều kiện cho việc module hóa và kiểm thử độc lập hiệu quả.'
  },
  {
    q: 'Tiêu chí nào sau đây là quan trọng nhất để đánh giá độ tin cậy (Reliability) của một phương pháp đo lường?',
    correct: 'Khả năng cho ra kết quả nhất quán và ổn định khi tiến hành đo lặp lại trong cùng điều kiện chuẩn',
    distractors: [
      'Đo lường được kết quả nhanh nhất mà không cần kiểm chứng lại',
      'Chi phí vận hành công cụ đo lường rẻ hơn so với các phương pháp khác',
      'Kết quả luôn trùng khớp hoàn toàn với mong muốn chủ quan ban đầu'
    ],
    exp: 'Độ tin cậy phản ánh tính ổn định và tính lặp lại (Reproducibility) của kết quả nghiên cứu khi loại trừ các sai số ngẫu nhiên.'
  }
];

// Nhận diện lĩnh vực của tài liệu để chọn câu hỏi phù hợp nhất
const detectDomain = (text: string): 'it_dev' | 'it_sys' | 'ai_data' | 'business' | 'general' => {
  const lower = text.toLowerCase();
  if (lower.includes('react') || lower.includes('typescript') || lower.includes('javascript') || lower.includes('python') || lower.includes('api') || lower.includes('database') || lower.includes('lập trình') || lower.includes('phần mềm') || lower.includes('frontend') || lower.includes('backend')) {
    return 'it_dev';
  }
  if (lower.includes('hệ điều hành') || lower.includes('mạng') || lower.includes('kiến trúc máy tính') || lower.includes('arm') || lower.includes('vi xử lý') || lower.includes('vi điều khiển') || lower.includes('tcp') || lower.includes('linux') || lower.includes('bộ nhớ')) {
    return 'it_sys';
  }
  if (lower.includes('trí tuệ nhân tạo') || lower.includes('machine learning') || lower.includes('học máy') || lower.includes('deep learning') || lower.includes('ai') || lower.includes('nơ-ron') || lower.includes('data')) {
    return 'ai_data';
  }
  if (lower.includes('quản trị') || lower.includes('kinh doanh') || lower.includes('marketing') || lower.includes('tài chính') || lower.includes('doanh nghiệp') || lower.includes('chiến lược') || lower.includes('khách hàng')) {
    return 'business';
  }
  return 'general';
};

// ==================== ENGINE SINH CÂU HỎI OFFLINE THÔNG MINH (KHÔNG CÓ TÊN FILE) ====================
export const generateOfflineQuizFromText = (
  rawTitle: string,
  rawContent: string,
  count: number,
  difficulty: DifficultyLevel
): Question[] => {
  const cleanTitle = sanitizeAcademicTopic(rawTitle);
  const combinedContext = `${cleanTitle} ${rawContent}`.slice(0, 10000);
  const domain = detectDomain(combinedContext);

  // Chọn ngân hàng theo lĩnh vực
  let pool: QuestionTemplate[];
  switch (domain) {
    case 'it_dev':
      pool = [...devQuestionPool, ...sysQuestionPool, ...generalQuestionPool];
      break;
    case 'it_sys':
      pool = [...sysQuestionPool, ...devQuestionPool, ...generalQuestionPool];
      break;
    case 'ai_data':
      pool = [...aiQuestionPool, ...devQuestionPool, ...generalQuestionPool];
      break;
    case 'business':
      pool = [...bizQuestionPool, ...generalQuestionPool, ...devQuestionPool];
      break;
    default:
      pool = [...generalQuestionPool, ...devQuestionPool, ...bizQuestionPool];
  }

  // Tách các câu thực tế từ nội dung người dùng dán (nếu có đoạn văn dài)
  const validUserSentences = rawContent
    .split(/\n|\. |\? |;/)
    .map((s) => cleanTextFromFileName(s))
    .filter((s) => s.length >= 35 && !s.toLowerCase().includes('tài liệu') && !s.includes('.pdf') && !s.includes('.docx'));

  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    const targetCorrectIndex = (i * 2 + 1) % 4; // luân phiên giữa B (1), D (3), B (1), D (3)...

    // Nếu người dùng có dán nội dung văn bản cụ thể, kết hợp câu hỏi bám sát câu văn
    if (validUserSentences.length > i && i < Math.min(count, 5)) {
      const sentence = validUserSentences[i];
      const diffPrefix = difficulty === 'easy' ? 'Nhận biết' : difficulty === 'medium' ? 'Vận dụng' : 'Phân tích';
      const questionText = `[${diffPrefix}] Nhận định nào sau đây diễn giải chính xác và chuẩn mực nhất luận điểm: "${sentence.slice(0, 120)}${sentence.length > 120 ? '...' : ''}"?`;

      const correctAns = sentence;
      const distractors: [string, string, string] = [
        'Trái ngược với nhận định trên, yếu tố này không mang lại giá trị thực tiễn trong triển khai.',
        'Nhận định này chỉ áp dụng trong phạm vi lý thuyết hạn hẹp và đã bị thay thế hoàn toàn.',
        'Không có sự liên kết nhân quả nào giữa luận điểm được nêu với kết quả vận hành chung.'
      ];

      const shuffled = shuffleOptions(correctAns, distractors, targetCorrectIndex);

      questions.push({
        id: `smart-q-${Date.now()}-${i + 1}`,
        question: questionText,
        options: shuffled.options,
        correctAnswerIndex: shuffled.correctIndex,
        explanation: `Kiến thức chuẩn xác: "${sentence}". Đây là nguyên lý then chốt cần nắm vững để đưa ra câu trả lời chính xác.`
      });
    } else {
      // Dùng câu hỏi học thuật từ kho kiến thức chuyên môn
      const shuffled = shuffleOptions(template.correct, template.distractors, targetCorrectIndex);

      questions.push({
        id: `smart-q-${Date.now()}-${i + 1}`,
        question: template.q,
        options: shuffled.options,
        correctAnswerIndex: shuffled.correctIndex,
        explanation: template.exp
      });
    }
  }

  return questions;
};
