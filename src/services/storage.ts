import type {
  DocumentItem,
  FlashcardDeck,
  QuizAttempt,
  QuizSet,
  UserStats,
  DifficultyLevel,
  Question
} from '../types';
import {
  initialDocuments,
  initialQuizSets,
  initialFlashcardDecks,
  initialHistory,
  initialUserStats
} from '../data/mockData';

const KEYS = {
  DOCUMENTS: 'd2p_documents_v2',
  QUIZ_SETS: 'd2p_quiz_sets_v2',
  FLASHCARDS: 'd2p_flashcards_v2',
  HISTORY: 'd2p_history_v2',
  STATS: 'd2p_stats_v2',
};

// Khởi tạo localStorage nếu chưa có dữ liệu
export const initStorage = () => {
  if (!localStorage.getItem(KEYS.DOCUMENTS)) {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(initialDocuments));
  }
  if (!localStorage.getItem(KEYS.QUIZ_SETS)) {
    localStorage.setItem(KEYS.QUIZ_SETS, JSON.stringify(initialQuizSets));
  }
  if (!localStorage.getItem(KEYS.FLASHCARDS)) {
    localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(initialFlashcardDecks));
  }
  if (!localStorage.getItem(KEYS.HISTORY)) {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(initialHistory));
  }
  if (!localStorage.getItem(KEYS.STATS)) {
    localStorage.setItem(KEYS.STATS, JSON.stringify(initialUserStats));
  }
};

// Documents
export const getDocuments = (): DocumentItem[] => {
  initStorage();
  try {
    const raw = localStorage.getItem(KEYS.DOCUMENTS);
    return raw ? JSON.parse(raw) : initialDocuments;
  } catch {
    return initialDocuments;
  }
};

export const addDocument = (doc: DocumentItem): void => {
  const current = getDocuments();
  const updated = [doc, ...current];
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(updated));

  // Cập nhật stats
  const stats = getStats();
  stats.totalDocuments = updated.length;
  saveStats(stats);
};

// Quiz Sets
export const getQuizSets = (): QuizSet[] => {
  initStorage();
  try {
    const raw = localStorage.getItem(KEYS.QUIZ_SETS);
    return raw ? JSON.parse(raw) : initialQuizSets;
  } catch {
    return initialQuizSets;
  }
};

export const getQuizSetById = (id: string): QuizSet | undefined => {
  const sets = getQuizSets();
  return sets.find((s) => s.id === id);
};

export const saveQuizSet = (quizSet: QuizSet): void => {
  const current = getQuizSets();
  const index = current.findIndex((s) => s.id === quizSet.id);
  let updated: QuizSet[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = quizSet;
  } else {
    updated = [quizSet, ...current];
  }
  localStorage.setItem(KEYS.QUIZ_SETS, JSON.stringify(updated));

  const stats = getStats();
  stats.totalQuizSets = updated.length;
  saveStats(stats);
};

// Flashcards
export const getFlashcardDecks = (): FlashcardDeck[] => {
  initStorage();
  try {
    const raw = localStorage.getItem(KEYS.FLASHCARDS);
    return raw ? JSON.parse(raw) : initialFlashcardDecks;
  } catch {
    return initialFlashcardDecks;
  }
};

export const updateCardStatus = (
  deckId: string,
  cardId: string,
  status: 'new' | 'learning' | 'mastered'
): void => {
  const decks = getFlashcardDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (deck) {
    const card = deck.cards.find((c) => c.id === cardId);
    if (card) {
      card.status = status;
      localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));
    }
  }
};

// History & Attempts
export const getHistory = (): QuizAttempt[] => {
  initStorage();
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : initialHistory;
  } catch {
    return initialHistory;
  }
};

export const recordQuizAttempt = (attempt: QuizAttempt): void => {
  const current = getHistory();
  const updated = [attempt, ...current];
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));

  // Cập nhật điểm gần nhất trong QuizSet
  const quizSets = getQuizSets();
  const quizIndex = quizSets.findIndex((s) => s.id === attempt.quizSetId);
  if (quizIndex >= 0) {
    quizSets[quizIndex].lastScore = attempt.score;
    quizSets[quizIndex].lastAttemptAt = attempt.completedAt;
    localStorage.setItem(KEYS.QUIZ_SETS, JSON.stringify(quizSets));
  }

  // Cập nhật UserStats
  const stats = getStats();
  stats.totalQuestionsAnswered += attempt.totalQuestions;
  const allScores = updated.map((h) => h.score);
  stats.averageScore = Math.round(
    allScores.reduce((acc, curr) => acc + curr, 0) / allScores.length
  );
  saveStats(stats);
};

// User Stats
export const getStats = (): UserStats => {
  initStorage();
  try {
    const raw = localStorage.getItem(KEYS.STATS);
    return raw ? JSON.parse(raw) : initialUserStats;
  } catch {
    return initialUserStats;
  }
};

export const saveStats = (stats: UserStats): void => {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
};

// Trình sinh câu hỏi mô phỏng cho Demo (dựa trên tên file và cài đặt)
export const simulateAIGeneration = (
  fileName: string,
  fileSize: string,
  count: number,
  difficulty: DifficultyLevel
): QuizSet => {
  // Trích xuất tiêu đề thân thiện từ tên tệp
  const cleanTitle = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .trim();

  const generatedQuestions: Question[] = [];

  const sampleBank = [
    {
      q: `Theo tài liệu "${cleanTitle}", luận điểm trọng tâm được tác giả nhấn mạnh ở chương mở đầu là gì?`,
      options: [
        'Xây dựng nền tảng tư duy và nắm vững các định nghĩa cốt lõi trước khi đi vào thực hành',
        'Bỏ qua các khái niệm lý thuyết và tập trung ngay vào công cụ nâng cao',
        'Giảm thiểu thời gian chuẩn bị và phụ thuộc hoàn toàn vào tài liệu tham khảo bên ngoài',
        'Chỉ áp dụng các quy chuẩn cho hệ thống quy mô lớn'
      ],
      correct: 0,
      exp: 'Tài liệu nhấn mạnh việc nắm vững khái niệm bản chất và mô hình tư duy sẽ giúp người học dễ dàng thích ứng với các tình huống biến đổi sau này.'
    },
    {
      q: `Phương pháp tối ưu nào được khuyến nghị trong "${cleanTitle}" khi xử lý các vấn đề phát sinh?`,
      options: [
        'Phân rã bài toán lớn thành các module nhỏ độc lập và kiểm tra từng bước',
        'Thay đổi toàn bộ cấu trúc cùng một lúc để tiết kiệm thời gian',
        'Bỏ qua các cảnh báo kiểm thử nếu hệ thống vẫn đang vận hành được',
        'Tái hiện lại vấn đề mà không cần ghi log theo dõi'
      ],
      correct: 0,
      exp: 'Nguyên lý chia để trị (Divide and Conquer) và kiểm thử cô lập từng module là phương pháp tiêu chuẩn được đề cập trong giáo trình.'
    },
    {
      q: `Yếu tố then chốt nào quyết định hiệu suất vận hành theo phân tích trong tài liệu này?`,
      options: [
        'Tối ưu hóa cấu trúc dữ liệu và giảm thiểu độ phức tạp thuật toán',
        'Liên tục nâng cấp phần cứng mà không cần đo lường tài nguyên',
        'Giảm số lượng tài liệu hướng dẫn và lược bỏ quy trình ghi chú',
        'Sử dụng các giải pháp phần mềm độc quyền thay vì mã nguồn mở'
      ],
      correct: 0,
      exp: 'Tài liệu khẳng định cấu trúc dữ liệu phù hợp đóng góp tới 80% hiệu quả tiết kiệm chi phí tính toán và bộ nhớ.'
    },
    {
      q: `Thuật ngữ hoặc mô hình nào sau đây gắn liền với nội dung chính của tài liệu?`,
      options: [
        'Mô hình phát triển tuần tự kết hợp vòng lặp phản hồi định kỳ',
        'Mô hình phi cấu trúc không ràng buộc kiểm soát',
        'Quy trình một chiều không có cơ chế hoàn tác',
        'Mô hình sao chép trực tiếp không qua tinh chỉnh'
      ],
      correct: 0,
      exp: 'Cơ chế lặp và phản hồi (Feedback loop) là cốt lõi để đảm bảo độ chính xác và chất lượng sau mỗi giai đoạn.'
    },
    {
      q: `Khi gặp lỗi không mong muốn trong quá trình thực hiện, tài liệu khuyến cáo bước đầu tiên là gì?`,
      options: [
        'Xác định phạm vi ảnh hưởng và kiểm tra thông tin log chi tiết',
        'Khởi động lại toàn bộ hệ thống ngay lập tức mà không sao lưu',
        'Xóa bỏ toàn bộ dữ liệu cấu hình cũ',
        'Tắt tính năng thông báo lỗi để tránh làm gián đoạn'
      ],
      correct: 0,
      exp: 'Bảo toàn hiện trạng và đọc kỹ log lỗi là nguyên tắc số 1 giúp tránh làm mất thông tin chẩn đoán quan trọng.'
    },
    {
      q: `Chỉ số đánh giá độ tin cậy được đề xuất trong tài liệu gồm tiêu chí nào?`,
      options: [
        'Tính nhất quán, tính khả dụng và khả năng phục hồi sau sự cố',
        'Tốc độ tải nhanh mà không cần kiểm tra tính toàn vẹn dữ liệu',
        'Chi phí đầu tư ban đầu thấp nhất có thể',
        'Số lượng tính năng nhiều nhất không phụ thuộc vào chất lượng'
      ],
      correct: 0,
      exp: 'Độ tin cậy được đo lường qua tam giác: Tính nhất quán (Consistency), Khả dụng (Availability) và Khả năng phục hồi (Resilience).'
    },
    {
      q: `Nguyên tắc bảo toàn dữ liệu được nhấn mạnh như thế nào trong "${cleanTitle}"?`,
      options: [
        'Thực hiện sao lưu định kỳ đa điểm và mã hóa khi truyền tải',
        'Chỉ sao lưu khi nhận thấy dấu hiệu bất thường',
        'Lưu trữ toàn bộ dữ liệu nhạy cảm trên một máy trạm duy nhất',
        'Phó thác hoàn toàn cho cơ chế tự động của nhà cung cấp'
      ],
      correct: 0,
      exp: 'Chiến lược sao lưu 3-2-1 và mã hóa dữ liệu là tiêu chuẩn an toàn bắt buộc được mô tả trong chương kết.'
    },
    {
      q: `Cách tiếp cận hiện đại nào được gợi ý để người học duy trì việc ôn tập hiệu quả lâu dài?`,
      options: [
        'Lặp lại ngắt quãng (Spaced Repetition) và chủ động truy hồi kiến thức qua câu hỏi thực hành',
        'Đọc thụ động lặp đi lặp lại một tài liệu nhiều lần',
        'Chỉ học dồn vào đêm trước kỳ thi hoặc thời điểm kiểm tra',
        'Ghi chép nguyên văn tất cả các trang sách mà không tóm tắt'
      ],
      correct: 0,
      exp: 'Nghiên cứu khoa học nhận thức chứng minh rằng Spaced Repetition (Lặp lại ngắt quãng) kết hợp Active Recall giúp tăng khả năng ghi nhớ lên gấp 3 lần.'
    },
    {
      q: `Giá trị lớn nhất của việc tự động hóa tạo câu hỏi ôn tập là gì?`,
      options: [
        'Biến việc tiếp nhận thụ động thành phản xạ trả lời chủ động và phát hiện ngay lỗ hổng kiến thức',
        'Không cần phải đọc tài liệu gốc nữa',
        'Đảm bảo 100% sẽ đạt điểm tối đa mà không cần tư duy',
        'Thay thế hoàn toàn vai trò của giáo viên và người hướng dẫn'
      ],
      correct: 0,
      exp: 'Luyện tập câu hỏi giúp người học tự kiểm tra (Self-testing), kích thích tế bào thần kinh liên kết khái niệm và nhanh chóng củng cố các điểm chưa hiểu.'
    },
    {
      q: `Theo tài liệu, bước tiếp theo sau khi hoàn thành bài luyện tập là gì?`,
      options: [
        'Phân tích kỹ lưỡng lời giải thích của các câu sai và ghi chú vào thẻ Flashcard để xem lại',
        'Bỏ qua kết quả và bắt đầu ngay tài liệu tiếp theo',
        'Chỉ quan tâm đến điểm số tổng kết mà không xem chi tiết',
        'Xóa tài liệu để giải phóng dung lượng'
      ],
      correct: 0,
      exp: 'Học từ lỗi sai và ôn lại qua Flashcard là chìa khóa then chốt để chuyển kiến thức từ trí nhớ ngắn hạn sang dài hạn.'
    }
  ];

  // Lấy số câu hỏi theo yêu cầu
  for (let i = 0; i < count; i++) {
    const item = sampleBank[i % sampleBank.length];
    generatedQuestions.push({
      id: `gen-q-${Date.now()}-${i + 1}`,
      question: `[Câu ${i + 1}] ${item.q}`,
      options: item.options,
      correctAnswerIndex: item.correct,
      explanation: item.exp
    });
  }

  const newQuizSet: QuizSet = {
    id: `quiz-${Date.now()}`,
    title: `Luyện tập: ${cleanTitle}`,
    description: `Bộ câu hỏi trắc nghiệm ${count} câu được tạo tự động từ tài liệu "${fileName}". Mức độ: ${
      difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Trung bình' : 'Nâng cao'
    }.`,
    sourceDocumentName: fileName,
    sourceDocumentSize: fileSize,
    questionCount: count,
    difficulty: difficulty,
    createdAt: new Date().toISOString().split('T')[0],
    lastScore: null,
    category: 'Tài liệu tải lên',
    questions: generatedQuestions
  };

  saveQuizSet(newQuizSet);

  // Đồng thời thêm Document vào danh sách tài liệu
  const newDoc: DocumentItem = {
    id: `doc-${Date.now()}`,
    name: fileName,
    size: fileSize,
    uploadedAt: new Date().toISOString().split('T')[0],
    pageCount: Math.max(12, count * 3),
    quizSetsGenerated: 1,
    status: 'ready'
  };
  addDocument(newDoc);

  // Tạo thêm bộ Flashcard tương ứng nếu người dùng muốn ôn thẻ
  const decks = getFlashcardDecks();
  const newDeck: FlashcardDeck = {
    id: `deck-${Date.now()}`,
    title: `Flashcards: ${cleanTitle}`,
    sourceDocumentName: fileName,
    cards: generatedQuestions.slice(0, Math.min(count, 5)).map((q, idx) => ({
      id: `gen-fc-${Date.now()}-${idx}`,
      front: q.question.replace(/^\[Câu \d+\] /, ''),
      back: `${q.options[q.correctAnswerIndex]}\n\nGiải thích: ${q.explanation}`,
      status: 'new'
    }))
  };
  decks.unshift(newDeck);
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));

  return newQuizSet;
};

