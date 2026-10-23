export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0, 1, 2, 3
  explanation: string;
}

export interface QuizSet {
  id: string;
  title: string;
  description: string;
  sourceDocumentName: string;
  sourceDocumentSize: string;
  questionCount: number;
  difficulty: DifficultyLevel;
  createdAt: string;
  lastScore?: number | null; // e.g. 80 (%)
  lastAttemptAt?: string;
  category: string;
  questions: Question[];
}

export interface Flashcard {
  id: string;
  front: string; // Câu hỏi / thuật ngữ
  back: string; // Định nghĩa / câu trả lời chi tiết
  example?: string;
  status: 'new' | 'learning' | 'mastered';
}

export interface FlashcardDeck {
  id: string;
  title: string;
  sourceDocumentName: string;
  cards: Flashcard[];
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  pageCount: number;
  quizSetsGenerated: number;
  status: 'ready' | 'processing';
}

export interface QuizAttempt {
  id: string;
  quizSetId: string;
  quizTitle: string;
  score: number; // Điểm thang 10 hoặc phần trăm
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
  durationSeconds: number;
  answers: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }[];
}

export interface UserStats {
  totalDocuments: number;
  totalQuizSets: number;
  totalQuestionsAnswered: number;
  averageScore: number;
  studyStreakDays: number;
}

