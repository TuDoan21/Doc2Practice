import type { DocumentItem, FlashcardDeck, QuizAttempt, QuizSet, UserStats } from '../types';

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Giao_trinh_React_TypeScript_Can_Ban.pdf',
    size: '3.4 MB',
    uploadedAt: '2026-10-20',
    pageCount: 42,
    quizSetsGenerated: 2,
    status: 'ready'
  },
  {
    id: 'doc-2',
    name: 'Kien_truc_May_tinh_Va_He_Dieu_Hanh_Ch3.pdf',
    size: '5.1 MB',
    uploadedAt: '2026-10-21',
    pageCount: 68,
    quizSetsGenerated: 1,
    status: 'ready'
  },
  {
    id: 'doc-3',
    name: 'De_cuong_On_tap_Tri_tue_Nhan_tao_2026.docx',
    size: '1.8 MB',
    uploadedAt: '2026-10-22',
    pageCount: 28,
    quizSetsGenerated: 1,
    status: 'ready'
  },
  {
    id: 'doc-4',
    name: 'Slide_Thuyet_trinh_Kien_truc_Mang_Ch4.pptx',
    size: '6.5 MB',
    uploadedAt: '2026-10-23',
    pageCount: 45,
    quizSetsGenerated: 1,
    status: 'ready'
  },
  {
    id: 'doc-5',
    name: 'Nguyen_ly_Quan_tri_Kinh_doanh_Tong_hop.pdf',
    size: '2.8 MB',
    uploadedAt: '2026-10-23',
    pageCount: 35,
    quizSetsGenerated: 1,
    status: 'ready'
  }
];

export const initialQuizSets: QuizSet[] = [
  {
    id: 'quiz-react-ts',
    title: 'React & TypeScript Cơ bản: Hooks và Props Typing',
    description: 'Kiểm tra kiến thức cốt lõi về useState, useEffect, kiểu dữ liệu Props và Generic Components trong React TypeScript.',
    sourceDocumentName: 'Giao_trinh_React_TypeScript_Can_Ban.pdf',
    sourceDocumentSize: '3.4 MB',
    questionCount: 5,
    difficulty: 'medium',
    createdAt: '2026-10-21',
    lastScore: 80,
    lastAttemptAt: '2026-10-22 15:30',
    category: 'Lập trình Web',
    questions: [
      {
        id: 'q-react-1',
        question: 'Trong TypeScript, cách nào sau đây là chuẩn nhất để khai báo kiểu cho props của một React Component có thuộc tính bắt buộc "title" và thuộc tính không bắt buộc "onClick"?',
        options: [
          'interface Props { title: string; onClick?: () => void; }',
          'type Props = { title: any; onClick: function; }',
          'interface Props { title: String; onClick!: void; }',
          'const Props = { title: string, onClick?: void }'
        ],
        correctAnswerIndex: 0,
        explanation: 'Trong TypeScript, cú pháp chuẩn cho thuộc tính tùy chọn là dấu hỏi chấm `onClick?: () => void;` và nên dùng kiểu nguyên thủy `string` thay vì kiểu đối tượng wrapper `String`.'
      },
      {
        id: 'q-react-2',
        question: 'Hook nào sau đây trong React được sử dụng để tối ưu hiệu năng bằng cách ghi nhớ giá trị tính toán tốn kém giữa các lần render?',
        options: [
          'useCallback',
          'useMemo',
          'useRef',
          'useReducer'
        ],
        correctAnswerIndex: 1,
        explanation: '`useMemo` ghi nhớ kết quả tính toán (memoized value), trong khi `useCallback` ghi nhớ định nghĩa hàm (memoized callback).'
      },
      {
        id: 'q-react-3',
        question: 'Khi sử dụng useEffect với mảng phụ thuộc rỗng `[]`, hàm effect sẽ chạy khi nào?',
        options: [
          'Chạy lại sau mỗi lần component re-render',
          'Chỉ chạy một lần duy nhất sau lần render đầu tiên (mount)',
          'Chạy trước khi component được gắn vào DOM',
          'Chạy mỗi khi có state bất kỳ thay đổi'
        ],
        correctAnswerIndex: 1,
        explanation: 'Mảng phụ thuộc rỗng `[]` báo cho React biết effect không phụ thuộc vào bất kỳ giá trị props hay state nào, do đó nó chỉ thực thi 1 lần duy nhất sau lần render đầu tiên.'
      },
      {
        id: 'q-react-4',
        question: 'Để gán ref cho một phần tử `<input />` trong React TypeScript, kiểu khai báo useRef nào là chính xác?',
        options: [
          'useRef<HTMLInputElement>(null)',
          'useRef<InputComponent>(0)',
          'useRef<Element>("input")',
          'useRef<HTMLFormElement>(null)'
        ],
        correctAnswerIndex: 0,
        explanation: 'Thẻ `<input>` trong DOM tương ứng với interface `HTMLInputElement`. Khởi tạo với giá trị `null` cho phép React gán DOM node khi mount.'
      },
      {
        id: 'q-react-5',
        question: 'Quy tắc vàng của React State là gì?',
        options: [
          'Có thể sửa trực tiếp state nếu đang ở trong hàm render',
          'Không bao giờ thay đổi trực tiếp (mutate) state, luôn sử dụng setter hoặc tạo bản sao mới',
          'State chỉ được phép chứa kiểu dữ liệu chuỗi hoặc số',
          'Tất cả state phải được lưu vào biến toàn cục window'
        ],
        correctAnswerIndex: 1,
        explanation: 'Nguyên tắc tính bất biến (Immutability) yêu cầu không thay đổi trực tiếp object/array của state mà phải thông qua setter function để kích hoạt cơ chế render lại của React.'
      }
    ]
  },
  {
    id: 'quiz-ai-docx',
    title: 'Trí tuệ Nhân tạo & Học máy Căn bản',
    description: 'Trích xuất từ tài liệu Word (.docx): Các khái niệm về Học có giám sát (Supervised Learning), Mạng nơ-ron và Gradient Descent.',
    sourceDocumentName: 'De_cuong_On_tap_Tri_tue_Nhan_tao_2026.docx',
    sourceDocumentSize: '1.8 MB',
    questionCount: 5,
    difficulty: 'medium',
    createdAt: '2026-10-22',
    lastScore: null,
    lastAttemptAt: undefined,
    category: 'Trí tuệ nhân tạo',
    questions: [
      {
        id: 'q-ai-1',
        question: 'Sự khác biệt cốt lõi giữa Học có giám sát (Supervised Learning) và Học không giám sát (Unsupervised Learning) là gì?',
        options: [
          'Dữ liệu huấn luyện của Supervised Learning có nhãn mục tiêu (Labels), còn Unsupervised Learning thì không có nhãn',
          'Supervised Learning chỉ áp dụng được với dữ liệu số',
          'Unsupervised Learning luôn cho độ chính xác 100%',
          'Supervised Learning không cần bước huấn luyện mô hình'
        ],
        correctAnswerIndex: 0,
        explanation: 'Trong Supervised Learning, mỗi mẫu dữ liệu đi kèm một nhãn đầu ra mong muốn để thuật toán học ánh xạ từ đặc trưng (Features) sang nhãn (Target).'
      },
      {
        id: 'q-ai-2',
        question: 'Mục tiêu chính của thuật toán Gradient Descent trong quá trình huấn luyện mạng nơ-ron là gì?',
        options: [
          'Tìm bộ trọng số (Weights) sao cho hàm mất mát (Loss Function) đạt giá trị cực tiểu',
          'Tăng tốc độ đọc dữ liệu từ ổ cứng',
          'Tự động bổ sung thêm các layer ẩn không giới hạn',
          'Xóa bỏ toàn bộ dữ liệu ngoại lai (Outliers)'
        ],
        correctAnswerIndex: 0,
        explanation: 'Gradient Descent là thuật toán tối ưu hóa lặp, cập nhật các trọng số theo hướng ngược chiều vector đạo hàm riêng để tối thiểu hóa sai số hàm mất mát.'
      },
      {
        id: 'q-ai-3',
        question: 'Hiện tượng Overfitting (Quá khớp) xảy ra khi nào?',
        options: [
          'Mô hình hoạt động rất tốt trên tập huấn luyện (Training Set) nhưng kém trên tập kiểm thử (Test Set)',
          'Mô hình quá đơn giản không học được quy luật dữ liệu',
          'Tập dữ liệu kiểm thử bị trùng lặp hoàn toàn với tập huấn luyện',
          'Thời gian huấn luyện quá ngắn'
        ],
        correctAnswerIndex: 0,
        explanation: 'Overfitting xảy ra khi mô hình ghi nhớ cả các nhiễu ngẫu nhiên trong dữ liệu train, làm mất đi khả năng tổng quát hóa (Generalization) đối với dữ liệu mới.'
      },
      {
        id: 'q-ai-4',
        question: 'Hàm kích hoạt (Activation Function) ReLU được biểu diễn bởi công thức nào sau đây?',
        options: [
          'f(x) = max(0, x)',
          'f(x) = 1 / (1 + e^-x)',
          'f(x) = (e^x - e^-x) / (e^x + e^-x)',
          'f(x) = x^2'
        ],
        correctAnswerIndex: 0,
        explanation: 'Hàm ReLU (Rectified Linear Unit) trả về 0 nếu x < 0 và trả về x nếu x >= 0, giúp giảm hiện tượng triệt tiêu đạo hàm (Vanishing Gradient).'
      },
      {
        id: 'q-ai-5',
        question: 'Kỹ thuật nào sau đây thường được sử dụng để giảm thiểu hiện tượng Overfitting?',
        options: [
          'Regularization (L1, L2), Dropout và Early Stopping',
          'Tăng kích thước mạng nơ-ron lên gấp 10 lần',
          'Bỏ qua việc chia tập Validation',
          'Huấn luyện thêm 10.000 epochs trên tập dữ liệu nhỏ'
        ],
        correctAnswerIndex: 0,
        explanation: 'Dropout ngẫu nhiên ngắt kết nối các nơ-ron trong quá trình train, kết hợp với L1/L2 Regularization phạt trọng số lớn giúp ngăn mô hình phụ thuộc quá mức vào các đặc trưng cụ thể.'
      }
    ]
  },
  {
    id: 'quiz-os-arch',
    title: 'Kiến trúc máy tính & Bộ nhớ ảo (Virtual Memory)',
    description: 'Các khái niệm về Paging, TLB, Cache Hit/Miss và Quản lý bộ nhớ phân đoạn trong hệ điều hành hiện đại.',
    sourceDocumentName: 'Kien_truc_May_tinh_Va_He_Dieu_Hanh_Ch3.pdf',
    sourceDocumentSize: '5.1 MB',
    questionCount: 5,
    difficulty: 'hard',
    createdAt: '2026-10-22',
    lastScore: null,
    lastAttemptAt: undefined,
    category: 'Khoa học máy tính',
    questions: [
      {
        id: 'q-os-1',
        question: 'Mục đích chính của bộ đệm TLB (Translation Lookaside Buffer) là gì?',
        options: [
          'Lưu trữ các chỉ lệnh CPU thường dùng nhất',
          'Tăng tốc độ chuyển đổi từ địa chỉ logic (ảo) sang địa chỉ vật lý bằng cách lưu tạm các mục trong bảng phân trang',
          'Thay thế hoàn toàn bộ nhớ RAM chính',
          'Ngăn ngừa virus thâm nhập vào kernel'
        ],
        correctAnswerIndex: 1,
        explanation: 'TLB là một bộ nhớ cache phần cứng tốc độ cực cao, lưu trữ các ánh xạ địa chỉ trang ảo -> khung trang vật lý để giảm thiểu số lần truy cập RAM khi tra bảng trang (Page Table).'
      },
      {
        id: 'q-os-2',
        question: 'Hiện tượng "Page Fault" (Lỗi trang) xảy ra khi nào?',
        options: [
          'Khi trang nhớ được yêu cầu không có sẵn trong bộ nhớ vật lý (RAM) và đang nằm trên đĩa',
          'Khi thanh ghi CPU bị tràn số nguyên',
          'Khi chương trình truy cập vào bộ nhớ của tiến trình khác mà không có quyền',
          'Khi quạt tản nhiệt của CPU ngừng quay'
        ],
        correctAnswerIndex: 0,
        explanation: 'Page fault là ngắt phần cứng xảy ra khi một tiến trình cố gắng truy cập một trang bộ nhớ ảo được đánh dấu là "chưa nạp vào RAM" (bit hợp lệ = 0), yêu cầu HĐH phải nạp trang đó từ ổ đĩa vào.'
      },
      {
        id: 'q-os-3',
        question: 'Thuật toán thay thế trang nào sau đây có nguy cơ gặp nghịch lý Belady (tăng số khung trang nhưng tăng số lỗi trang)?',
        options: [
          'LRU (Least Recently Used)',
          'FIFO (First-In, First-Out)',
          'Optimal (Tối ưu)',
          'LFU (Least Frequently Used)'
        ],
        correctAnswerIndex: 1,
        explanation: 'Nghịch lý Belady được chứng minh xuất hiện trong thuật toán FIFO, trong khi các thuật toán lớp ngăn xếp như LRU và Optimal miễn nhiễm với hiện tượng này.'
      },
      {
        id: 'q-os-4',
        question: 'Phân đoạn bộ nhớ (Segmentation) khác với phân trang (Paging) ở điểm cốt lõi nào?',
        options: [
          'Paging chia bộ nhớ thành các khối có kích thước cố định, còn Segmentation chia theo đơn vị logic có kích thước biến thiên',
          'Segmentation chỉ dùng trên máy tính 32-bit',
          'Paging nhanh hơn 100 lần so với Segmentation trong mọi trường hợp',
          'Segmentation không cần sự hỗ trợ của phần cứng'
        ],
        correctAnswerIndex: 0,
        explanation: 'Paging chia không gian địa chỉ thành các trang (Pages) có kích thước cố định vật lý (thường là 4KB), trong khi Segmentation chia theo quan điểm logic của lập trình viên (code, data, stack) với kích thước tùy biến.'
      },
      {
        id: 'q-os-5',
        question: 'Hiện tượng Thrashing (Đảo trang liên tục) xảy ra khi nào?',
        options: [
          'Tiến trình dành nhiều thời gian để nạp/xuất trang bộ nhớ hơn là thực thi lệnh hữu ích',
          'Đĩa cứng bị phân mảnh quá 50%',
          'Bộ nhớ RAM còn trống quá nhiều',
          'Card màn hình không tương thích với bo mạch chủ'
        ],
        correctAnswerIndex: 0,
        explanation: 'Thrashing xảy ra khi tổng tập làm việc (Working Set) của các tiến trình vượt quá dung lượng RAM thực tế, dẫn đến CPU liên tục phải xử lý ngắt nạp/xóa trang giữa RAM và Swap disk.'
      }
    ]
  },
  {
    id: 'quiz-management',
    title: 'Nguyên lý Quản trị & Hoạch định Chiến lược',
    description: 'Các mô hình phân tích SWOT, 5 lực lượng cạnh tranh của Porter và kỹ năng lãnh đạo tổ chức.',
    sourceDocumentName: 'Nguyen_ly_Quan_tri_Kinh_doanh_Tong_hop.pdf',
    sourceDocumentSize: '2.8 MB',
    questionCount: 5,
    difficulty: 'easy',
    createdAt: '2026-10-22',
    lastScore: 100,
    lastAttemptAt: '2026-10-23 09:15',
    category: 'Kinh tế & Quản trị',
    questions: [
      {
        id: 'q-mgmt-1',
        question: 'Chữ cái "W" trong mô hình phân tích chiến lược SWOT đại diện cho yếu tố nào?',
        options: [
          'Weaknesses (Điểm yếu bên trong tổ chức)',
          'Wealth (Nguồn tài chính)',
          'Workers (Lực lượng lao động)',
          'Warnings (Các cảnh báo thị trường)'
        ],
        correctAnswerIndex: 0,
        explanation: 'SWOT là viết tắt của Strengths (Điểm mạnh), Weaknesses (Điểm yếu), Opportunities (Cơ hội) và Threats (Thách thức).'
      },
      {
        id: 'q-mgmt-2',
        question: 'Mô hình 5 lực lượng cạnh tranh (Five Forces) nổi tiếng do giáo sư nào đề xướng?',
        options: [
          'Philip Kotler',
          'Michael Porter',
          'Peter Drucker',
          'Warren Buffett'
        ],
        correctAnswerIndex: 1,
        explanation: 'Mô hình 5 lực lượng cạnh tranh được Michael Porter (Trường Kinh doanh Harvard) công bố năm 1979 để phân tích sức hấp dẫn và cấu trúc ngành.'
      },
      {
        id: 'q-mgmt-3',
        question: 'Bốn chức năng cốt lõi của nhà quản trị theo trình tự cổ điển gồm những gì?',
        options: [
          'Hoạch định, Tổ chức, Lãnh đạo, Kiểm tra (POLC)',
          'Sản xuất, Bán hàng, Thu tiền, Tuyển dụng',
          'Lập kế hoạch, Mua sắm, Đầu tư, Báo cáo',
          'Khởi nghiệp, Gọi vốn, Tiếp thị, Thoái vốn'
        ],
        correctAnswerIndex: 0,
        explanation: 'Chu trình quản trị kinh điển gồm Planning (Hoạch định) -> Organizing (Tổ chức) -> Leading (Lãnh đạo) -> Controlling (Kiểm tra).'
      },
      {
        id: 'q-mgmt-4',
        question: 'Mục tiêu SMART đòi hỏi tiêu chí nào sau đây?',
        options: [
          'Cụ thể, Đo lường được, Khả thi, Thích hợp, Có thời hạn',
          'Siêu nhanh, Mạnh mẽ, Đắt giá, Rõ ràng, Tối ưu',
          'Bí mật, An toàn, Hiện đại, Linh hoạt, Tin cậy',
          'Dài hạn, Tổng quát, Tự do, Tự động hóa, Thực tiễn'
        ],
        correctAnswerIndex: 0,
        explanation: 'SMART = Specific (Cụ thể), Measurable (Đo lường được), Achievable (Khả thi), Relevant (Thích hợp), Time-bound (Có thời hạn).'
      },
      {
        id: 'q-mgmt-5',
        question: 'Phong cách lãnh đạo nào trao quyền tối đa cho cấp dưới tự quyết định và tự chịu trách nhiệm?',
        options: [
          'Phong cách độc đoán (Autocratic)',
          'Phong cách tự do (Laissez-faire)',
          'Phong cách dân chủ (Democratic)',
          'Phong cách giao dịch (Transactional)'
        ],
        correctAnswerIndex: 1,
        explanation: 'Laissez-faire (ủy thác / tự do) là phong cách lãnh đạo trong đó nhà quản lý cung cấp nguồn lực nhưng để nhân viên tự ra quyết định và tự quản lý công việc.'
      }
    ]
  }
];

export const initialFlashcardDecks: FlashcardDeck[] = [
  {
    id: 'deck-ai',
    title: 'Flashcards: Trí tuệ Nhân tạo & Machine Learning',
    sourceDocumentName: 'De_cuong_On_tap_Tri_tue_Nhan_tao_2026.docx',
    cards: [
      {
        id: 'fc-ai-1',
        front: 'Supervised Learning (Học có giám sát)',
        back: 'Phương pháp huấn luyện mô hình dựa trên tập dữ liệu đã được gán nhãn mục tiêu (Input X -> Target Y).',
        example: 'Phân loại thư rác (Spam/Not Spam), Dự đoán giá nhà.',
        status: 'mastered'
      },
      {
        id: 'fc-ai-2',
        front: 'Epoch trong Machine Learning là gì?',
        back: 'Một Epoch tương ứng với việc toàn bộ tập dữ liệu huấn luyện đã được truyền qua mạng nơ-ron một lượt (forward pass và backward pass).',
        example: 'Training model for 50 epochs.',
        status: 'learning'
      },
      {
        id: 'fc-ai-3',
        front: 'Loss Function (Hàm mất mát)',
        back: 'Hàm số đo lường mức độ sai lệch giữa kết quả dự đoán của mô hình và giá trị thực tế của nhãn mục tiêu.',
        example: 'MSE (Mean Squared Error), Cross-Entropy Loss.',
        status: 'new'
      }
    ]
  },
  {
    id: 'deck-react',
    title: 'React & TypeScript Flashcards',
    sourceDocumentName: 'Giao_trinh_React_TypeScript_Can_Ban.pdf',
    cards: [
      {
        id: 'fc-1',
        front: 'Props vs State trong React',
        back: 'Props là dữ liệu truyền từ ngoài vào (cha sang con) và chỉ đọc (read-only). State là trạng thái nội bộ do chính component đó quản lý và có thể thay đổi được.',
        example: 'Props: <UserCard name="An" /> | State: const [count, setCount] = useState(0)',
        status: 'mastered'
      },
      {
        id: 'fc-2',
        front: 'Clean-up function trong useEffect chạy khi nào?',
        back: 'Chạy ngay trước khi component unmount, hoặc trước khi effect kế tiếp được thực thi (nếu các dependencies thay đổi). Dùng để hủy subscribe, clear timer, abort fetch.',
        example: 'return () => clearInterval(timerId);',
        status: 'learning'
      },
      {
        id: 'fc-3',
        front: 'Type vs Interface trong TypeScript',
        back: 'Interface có thể kế thừa và tự gộp (declaration merging), thường dùng cho đối tượng và OOP. Type linh hoạt hơn, hỗ trợ Union (|), Intersection (&), Tuple và Primitives.',
        example: 'type Status = "idle" | "loading" | "success";',
        status: 'mastered'
      }
    ]
  }
];

export const initialHistory: QuizAttempt[] = [
  {
    id: 'att-1',
    quizSetId: 'quiz-management',
    quizTitle: 'Nguyên lý Quản trị & Hoạch định Chiến lược',
    score: 100,
    correctCount: 5,
    totalQuestions: 5,
    completedAt: '2026-10-23 09:15',
    durationSeconds: 124,
    answers: [
      { questionId: 'q-mgmt-1', selectedIndex: 0, isCorrect: true },
      { questionId: 'q-mgmt-2', selectedIndex: 1, isCorrect: true },
      { questionId: 'q-mgmt-3', selectedIndex: 0, isCorrect: true },
      { questionId: 'q-mgmt-4', selectedIndex: 0, isCorrect: true },
      { questionId: 'q-mgmt-5', selectedIndex: 1, isCorrect: true }
    ]
  },
  {
    id: 'att-2',
    quizSetId: 'quiz-react-ts',
    quizTitle: 'React & TypeScript Cơ bản: Hooks và Props Typing',
    score: 80,
    correctCount: 4,
    totalQuestions: 5,
    completedAt: '2026-10-22 15:30',
    durationSeconds: 180,
    answers: [
      { questionId: 'q-react-1', selectedIndex: 0, isCorrect: true },
      { questionId: 'q-react-2', selectedIndex: 1, isCorrect: true },
      { questionId: 'q-react-3', selectedIndex: 1, isCorrect: true },
      { questionId: 'q-react-4', selectedIndex: 0, isCorrect: true },
      { questionId: 'q-react-5', selectedIndex: 0, isCorrect: false }
    ]
  }
];

export const weeklyActivityData = [
  { day: 'T2', questions: 12, avgScore: 78 },
  { day: 'T3', questions: 25, avgScore: 84 },
  { day: 'T4', questions: 18, avgScore: 75 },
  { day: 'T5', questions: 30, avgScore: 90 },
  { day: 'T6', questions: 15, avgScore: 82 },
  { day: 'T7', questions: 40, avgScore: 88 },
  { day: 'CN', questions: 22, avgScore: 85 },
];

export const initialUserStats: UserStats = {
  totalDocuments: 5,
  totalQuizSets: 4,
  totalQuestionsAnswered: 50,
  averageScore: 88,
  studyStreakDays: 5
};
