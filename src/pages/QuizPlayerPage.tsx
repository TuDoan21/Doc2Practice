import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ListFilter,
  AlertTriangle,
  Award
} from 'lucide-react';
import { getQuizSetById, recordQuizAttempt } from '../services/storage';
import type { QuizSet, QuizAttempt } from '../types';
import { Modal } from '../components/common/Modal';
import { DifficultyBadge } from '../components/common/Badge';

export const QuizPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!id) return;
    const found = getQuizSetById(id);
    if (found) {
      setQuizSet(found);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setSecondsElapsed(0);
    } else {
      navigate('/app/quiz-sets');
    }
  }, [id, navigate]);

  // Timer tick
  useEffect(() => {
    if (isSubmitted || !quizSet) return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, quizSet]);

  if (!quizSet) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentQuestion = quizSet.questions[currentIndex];
  const totalQuestions = quizSet.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Nộp bài
  const handleConfirmSubmit = () => {
    setIsConfirmModalOpen(false);
    setIsSubmitted(true);

    // Tính điểm
    let correctCount = 0;
    const answerLogs = quizSet.questions.map((q, idx) => {
      const selected = selectedAnswers[idx] ?? -1;
      const isCorrect = selected === q.correctAnswerIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedIndex: selected,
        isCorrect,
      };
    });

    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    // Lưu vào lịch sử & update stats
    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizSetId: quizSet.id,
      quizTitle: quizSet.title,
      score: scorePercent,
      correctCount,
      totalQuestions,
      completedAt: new Date().toLocaleString('vi-VN'),
      durationSeconds: secondsElapsed,
      answers: answerLogs,
    };
    recordQuizAttempt(attempt);

    // Bắn confetti nếu điểm >= 80%
    if (scorePercent >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setSecondsElapsed(0);
    setReviewFilter('all');
  };

  // Định dạng thời gian
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tính kết quả sau khi nộp
  const correctCount = quizSet.questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctAnswerIndex ? acc + 1 : acc;
  }, 0);
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // Bộ lọc xem lại
  const filteredQuestionIndices = quizSet.questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => {
      const isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
      if (reviewFilter === 'incorrect') return !isCorrect;
      if (reviewFilter === 'correct') return isCorrect;
      return true;
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Quiz Top Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DifficultyBadge difficulty={quizSet.difficulty} />
              <span className="text-xs text-slate-400">Nguồn: {quizSet.sourceDocumentName}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {quizSet.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            {!isSubmitted ? (
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102"
              >
                Nộp bài ({answeredCount}/{totalQuestions})
              </button>
            ) : (
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Tiến độ làm bài: {answeredCount}/{totalQuestions} câu</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick jump question numbers */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {quizSet.questions.map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white'
                    : isAnswered
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode 1: During Quiz (Chưa nộp bài) */}
      {!isSubmitted && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Question Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Câu hỏi {currentIndex + 1} trên {totalQuestions}
            </span>
            <span className="text-xs text-slate-400">Chọn 1 đáp án chính xác nhất</span>
          </div>

          {/* Question Text */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Options Grid */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {optionLetter}
                  </span>
                  <span className="text-sm leading-relaxed pt-0.5">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                currentIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  <span>Xem lại và nộp bài</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Results & Explanations (Sau khi nộp bài) */}
      {isSubmitted && (
        <div className="space-y-6">
          {/* Summary Score Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div
                  className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black shadow-inner shrink-0 ${
                    scorePercent >= 80
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : scorePercent >= 50
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  <span className="text-2xl leading-none">{scorePercent}%</span>
                  <span className="text-[10px] font-semibold uppercase mt-1">
                    {correctCount}/{totalQuestions} câu
                  </span>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                    <Award className="w-4 h-4" />
                    <span>
                      {scorePercent >= 80
                        ? 'Tuyệt vời! Bạn nắm rất vững kiến thức'
                        : scorePercent >= 50
                        ? 'Khá tốt! Hãy ôn kỹ các câu làm sai'
                        : 'Cần ôn tập thêm tài liệu này'}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Kết quả bài kiểm tra
                  </h2>
                  <p className="text-xs text-slate-500">
                    Thời gian hoàn thành: {formatTime(secondsElapsed)} • Đã lưu vào lịch sử
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Làm lại bài này
                </button>
                <Link
                  to="/app/quiz-sets"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Danh sách đề thi
                </Link>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" />
                <span>Bộ lọc xem:</span>
              </span>
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  reviewFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({totalQuestions})
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  reviewFilter === 'incorrect'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Chỉ câu sai ({totalQuestions - correctCount})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Câu đúng ({correctCount})
              </button>
            </div>
          </div>

          {/* List of Questions with Detailed Explanations */}
          <div className="space-y-4">
            {filteredQuestionIndices.map(({ q, idx }) => {
              const userSelected = selectedAnswers[idx];
              const isCorrect = userSelected === q.correctAnswerIndex;

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-3xl bg-white border shadow-sm space-y-4 ${
                    isCorrect ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        Câu {idx + 1}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chính xác</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Chưa chính xác</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {q.question}
                  </h3>

                  {/* 4 Options breakdown */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isOptionCorrect = optIdx === q.correctAnswerIndex;
                      const isOptionUserSelected = optIdx === userSelected;

                      let rowClass = 'border-slate-100 bg-slate-50/60 text-slate-600';
                      if (isOptionCorrect) {
                        rowClass = 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold';
                      } else if (isOptionUserSelected && !isOptionCorrect) {
                        rowClass = 'border-rose-300 bg-rose-50 text-rose-950 font-medium line-through';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${rowClass}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold w-5 h-5 rounded flex items-center justify-center bg-white/70 text-slate-800 text-xs shadow-xs">
                              {letter}
                            </span>
                            <span>{opt}</span>
                          </div>
                          <div className="shrink-0 text-xs">
                            {isOptionCorrect && (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Đáp án đúng</span>
                              </span>
                            )}
                            {isOptionUserSelected && !isOptionCorrect && (
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                <span>Bạn đã chọn</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>Giải thích chi tiết:</span>
                    </div>
                    <p className="text-indigo-950/80 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Submission */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Xác nhận nộp bài"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Bạn đã trả lời <span className="font-bold text-indigo-600">{answeredCount}/{totalQuestions}</span> câu hỏi.
              </p>
              {answeredCount < totalQuestions && (
                <p className="text-xs text-rose-600 mt-1 font-semibold">
                  ⚠️ Còn {totalQuestions - answeredCount} câu chưa được chọn đáp án. Bạn vẫn muốn nộp bài?
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Tiếp tục làm
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              Xác nhận nộp
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

