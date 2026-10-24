import type {
  DocumentItem,
  FlashcardDeck,
  QuizAttempt,
  QuizSet,
  UserStats,
  DifficultyLevel,
  Question,
  Flashcard
} from '../types';
import {
  initialDocuments,
  initialQuizSets,
  initialFlashcardDecks,
  initialHistory,
  initialUserStats
} from '../data/mockData';
import {
  getStoredApiKey,
  generateQuizWithGemini,
  generateFlashcardsWithGemini,
  generateOfflineQuizFromText
} from './aiService';

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

// ==================== DOCUMENTS ====================
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

  const stats = getStats();
  stats.totalDocuments = updated.length;
  saveStats(stats);
};

export const deleteDocument = (id: string): void => {
  const current = getDocuments();
  const updated = current.filter((d) => d.id !== id);
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(updated));

  const stats = getStats();
  stats.totalDocuments = updated.length;
  saveStats(stats);
};

// ==================== QUIZ SETS ====================
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

export const deleteQuizSet = (id: string): void => {
  const current = getQuizSets();
  const updated = current.filter((s) => s.id !== id);
  localStorage.setItem(KEYS.QUIZ_SETS, JSON.stringify(updated));

  const stats = getStats();
  stats.totalQuizSets = updated.length;
  saveStats(stats);
};

// ==================== FLASHCARDS ====================
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

export const addCardToDeck = (deckId: string, card: Omit<Flashcard, 'id' | 'status'>): void => {
  const decks = getFlashcardDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (deck) {
    const newCard: Flashcard = {
      ...card,
      id: `fc-${Date.now()}`,
      status: 'new',
    };
    deck.cards.unshift(newCard);
    localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));
  }
};

export const deleteCardFromDeck = (deckId: string, cardId: string): void => {
  const decks = getFlashcardDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (deck) {
    deck.cards = deck.cards.filter((c) => c.id !== cardId);
    localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));
  }
};

export const resetDeckProgress = (deckId: string): void => {
  const decks = getFlashcardDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (deck) {
    deck.cards.forEach((c) => {
      c.status = 'new';
    });
    localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));
  }
};

// ==================== HISTORY & ATTEMPTS ====================
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

export const deleteHistoryAttempt = (id: string): void => {
  const current = getHistory();
  const updated = current.filter((h) => h.id !== id);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
};

export const clearAllHistory = (): void => {
  localStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
  const stats = getStats();
  stats.totalQuestionsAnswered = 0;
  stats.averageScore = 0;
  saveStats(stats);
};

// ==================== STATS ====================
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

// ==================== GENERATION ENGINE ====================
// Tạo bộ câu hỏi từ tệp hoặc văn bản người dùng nhập
export const createQuizAndFlashcards = async (params: {
  title: string;
  sourceType: 'file' | 'text';
  fileName?: string;
  fileSize?: string;
  textContent: string;
  questionCount: number;
  difficulty: DifficultyLevel;
}): Promise<QuizSet> => {
  const { title, fileName, fileSize, textContent, questionCount, difficulty } = params;
  const docName = fileName || `${title}.docx`;
  const docSize = fileSize || `${Math.max(1, Math.round(textContent.length / 1024))} KB`;

  const apiKey = getStoredApiKey();
  let questions: Question[] = [];
  let flashcards: Flashcard[] = [];

  // 1. Thử gọi Gemini API nếu có key
  if (apiKey) {
    try {
      questions = await generateQuizWithGemini(textContent, questionCount, difficulty, apiKey);
      flashcards = await generateFlashcardsWithGemini(textContent, Math.min(questionCount, 6), apiKey);
    } catch (geminiError) {
      console.warn('Gemini API call failed, falling back to smart extractor:', geminiError);
      questions = generateOfflineQuizFromText(title, textContent, questionCount, difficulty);
    }
  } else {
    // 2. Không có key: dùng engine ngữ nghĩa nội bộ bám sát nội dung
    questions = generateOfflineQuizFromText(title, textContent, questionCount, difficulty);
  }

  // Đảm bảo có flashcards
  if (flashcards.length === 0) {
    flashcards = questions.slice(0, Math.min(questionCount, 6)).map((q, idx) => ({
      id: `fc-gen-${Date.now()}-${idx + 1}`,
      front: q.question.replace(/^\[.*?\]\s*/, ''),
      back: `Đáp án: ${q.options[q.correctAnswerIndex]}\n\n${q.explanation}`,
      status: 'new' as const,
    }));
  }

  // Tạo QuizSet
  const newQuizSet: QuizSet = {
    id: `quiz-${Date.now()}`,
    title: title.startsWith('Luyện tập:') ? title : `Luyện tập: ${title}`,
    description: `Bộ câu hỏi trắc nghiệm ${questionCount} câu từ "${docName}". Độ khó: ${
      difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Trung bình' : 'Nâng cao'
    }.`,
    sourceDocumentName: docName,
    sourceDocumentSize: docSize,
    questionCount: questions.length,
    difficulty: difficulty,
    createdAt: new Date().toISOString().split('T')[0],
    lastScore: null,
    category: 'Tài liệu tự học',
    questions: questions,
  };

  saveQuizSet(newQuizSet);

  // Lưu tài liệu vào danh sách
  const newDoc: DocumentItem = {
    id: `doc-${Date.now()}`,
    name: docName,
    size: docSize,
    uploadedAt: new Date().toISOString().split('T')[0],
    pageCount: Math.max(1, Math.ceil(textContent.length / 1500)),
    quizSetsGenerated: 1,
    status: 'ready',
  };
  addDocument(newDoc);

  // Lưu Flashcard deck
  const decks = getFlashcardDecks();
  decks.unshift({
    id: `deck-${Date.now()}`,
    title: `Flashcards: ${title}`,
    sourceDocumentName: docName,
    cards: flashcards,
  });
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));

  return newQuizSet;
};

// Hàm mô phỏng tương thích ngược cho file upload demo
export const simulateAIGeneration = (
  fileName: string,
  fileSize: string,
  count: number,
  difficulty: DifficultyLevel
): QuizSet => {
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
    }
  ];

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
    description: `Bộ câu hỏi trắc nghiệm ${count} câu từ "${fileName}". Mức độ: ${
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

  const decks = getFlashcardDecks();
  decks.unshift({
    id: `deck-${Date.now()}`,
    title: `Flashcards: ${cleanTitle}`,
    sourceDocumentName: fileName,
    cards: generatedQuestions.slice(0, Math.min(count, 5)).map((q, idx) => ({
      id: `gen-fc-${Date.now()}-${idx}`,
      front: q.question.replace(/^\[Câu \d+\] /, ''),
      back: `${q.options[q.correctAnswerIndex]}\n\nGiải thích: ${q.explanation}`,
      status: 'new'
    }))
  });
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));

  return newQuizSet;
};

// ==================== EXPORT / IMPORT UTILS ====================

// Trợ giúp tải file về máy
export const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Xuất bộ đề ra file JSON
export const exportQuizSetJson = (quizSet: QuizSet) => {
  const data = JSON.stringify(quizSet, null, 2);
  const safeTitle = quizSet.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  downloadFile(`${safeTitle}_quiz.json`, data, 'application/json');
};

// Xuất bộ đề ra CSV chuẩn Anki / Quizlet
export const exportQuizSetCsv = (quizSet: QuizSet) => {
  let csvContent = 'Câu hỏi\tĐáp án đúng & Giải thích\n';
  quizSet.questions.forEach((q) => {
    const front = `"${q.question.replace(/"/g, '""')}\n\nA. ${q.options[0]}\nB. ${q.options[1]}\nC. ${q.options[2]}\nD. ${q.options[3]}"`;
    const back = `"Đáp án: ${String.fromCharCode(65 + q.correctAnswerIndex)}. ${q.options[q.correctAnswerIndex]}\n\nGiải thích: ${q.explanation.replace(/"/g, '""')}"`;
    csvContent += `${front}\t${back}\n`;
  });
  const safeTitle = quizSet.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  downloadFile(`${safeTitle}_anki.tsv`, csvContent, 'text/tab-separated-values;charset=utf-8;');
};

// Nhập bộ đề từ JSON
export const importQuizSetJson = (jsonString: string): QuizSet => {
  const parsed = JSON.parse(jsonString);
  if (!parsed.title || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Dữ liệu JSON không hợp lệ hoặc không có danh sách câu hỏi.');
  }

  const newQuizSet: QuizSet = {
    id: `quiz-imported-${Date.now()}`,
    title: `${parsed.title} (Đã nhập)`,
    description: parsed.description || 'Bộ câu hỏi được nhập từ file dữ liệu.',
    sourceDocumentName: parsed.sourceDocumentName || 'Tệp nhập khẩu',
    sourceDocumentSize: parsed.sourceDocumentSize || '150 KB',
    questionCount: parsed.questions.length,
    difficulty: parsed.difficulty || 'medium',
    createdAt: new Date().toISOString().split('T')[0],
    lastScore: null,
    category: parsed.category || 'Tệp đã nhập',
    questions: parsed.questions.map((q: any, idx: number) => ({
      id: `q-imp-${Date.now()}-${idx}`,
      question: q.question || `Câu hỏi ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
      correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
      explanation: q.explanation || 'Chưa có giải thích chi tiết.'
    }))
  };

  saveQuizSet(newQuizSet);
  return newQuizSet;
};

// Xuất bộ Flashcards ra file JSON
export const exportFlashcardDeckJson = (deck: FlashcardDeck) => {
  const data = JSON.stringify(deck, null, 2);
  const safeTitle = deck.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  downloadFile(`${safeTitle}_flashcards.json`, data, 'application/json');
};

// Xuất bộ Flashcards ra Anki TSV
export const exportFlashcardDeckAnki = (deck: FlashcardDeck) => {
  let content = 'Front\tBack\n';
  deck.cards.forEach((card) => {
    const front = `"${card.front.replace(/"/g, '""')}"`;
    const back = `"${card.back.replace(/"/g, '""')}"`;
    content += `${front}\t${back}\n`;
  });
  const safeTitle = deck.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  downloadFile(`${safeTitle}_anki.tsv`, content, 'text/tab-separated-values;charset=utf-8;');
};

// Nhập bộ Flashcard từ JSON
export const importFlashcardDeckJson = (jsonString: string): FlashcardDeck => {
  const parsed = JSON.parse(jsonString);
  if (!parsed.title || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
    throw new Error('Dữ liệu JSON không hợp lệ hoặc không có danh sách thẻ ghi nhớ.');
  }

  const decks = getFlashcardDecks();
  const newDeck: FlashcardDeck = {
    id: `deck-imp-${Date.now()}`,
    title: `${parsed.title} (Đã nhập)`,
    sourceDocumentName: parsed.sourceDocumentName || 'Tệp nhập khẩu',
    cards: parsed.cards.map((c: any, idx: number) => ({
      id: `card-imp-${Date.now()}-${idx}`,
      front: c.front || `Thuật ngữ ${idx + 1}`,
      back: c.back || 'Định nghĩa / Giải thích',
      status: 'new'
    }))
  };

  decks.unshift(newDeck);
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(decks));
  return newDeck;
};

// ==================== MISTAKE BANK (NGÂN HÀNG CÂU HỎI SAI) ====================

// Lấy danh sách tất cả các câu hỏi từng làm sai (đã loại bỏ trùng lặp)
export const getUniqueMistakes = (): Question[] => {
  const history = getHistory();
  const quizSets = getQuizSets();
  const mistakeMap = new Map<string, Question>();

  // Bản đồ tra cứu nhanh câu hỏi theo ID từ các bộ đề
  const questionMap = new Map<string, Question>();
  quizSets.forEach((qs) => {
    qs.questions.forEach((q) => {
      questionMap.set(q.id, q);
    });
  });

  history.forEach((attempt) => {
    attempt.answers.forEach((ans) => {
      if (!ans.isCorrect) {
        const found = questionMap.get(ans.questionId);
        if (found) {
          const key = found.question.trim().toLowerCase();
          if (!mistakeMap.has(key)) {
            mistakeMap.set(key, found);
          }
        }
      }
    });
  });

  return Array.from(mistakeMap.values());
};

// Tạo đề ôn tập từ ngân hàng câu sai
export const createMistakeBankQuizSet = (): QuizSet | null => {
  const mistakes = getUniqueMistakes();
  if (mistakes.length === 0) return null;

  const newQuizSet: QuizSet = {
    id: `quiz-mistakes-${Date.now()}`,
    title: `⚡ Ôn Tập Lỗ Hổng Kiến Thức (${mistakes.length} câu đã từng sai)`,
    description: `Bộ câu hỏi tổng hợp tất cả các câu hỏi bạn từng trả lời sai trong lịch sử kiểm tra.`,
    sourceDocumentName: 'Ngân hàng câu hỏi sai cá nhân',
    sourceDocumentSize: `${mistakes.length * 2} KB`,
    questionCount: mistakes.length,
    difficulty: 'hard',
    createdAt: new Date().toISOString().split('T')[0],
    lastScore: null,
    category: 'Ngân hàng câu sai',
    questions: mistakes
  };

  saveQuizSet(newQuizSet);
  return newQuizSet;
};
