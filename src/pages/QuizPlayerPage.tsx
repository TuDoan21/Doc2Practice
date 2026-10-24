import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  Award,
  Bookmark,
  Printer,
  Sparkles,
  BookOpen,
  ShieldAlert,
  Users,
  Eye
} from 'lucide-react';
import { getQuizSetById, recordQuizAttempt } from '../services/storage';
import { getAssignmentById, recordStudentSubmission, recordStudentTabViolation } from '../services/classService';
import { getCurrentUser } from '../services/auth';
import type { QuizSet, QuizAttempt, Question, ClassAssignment } from '../types';
import { Modal } from '../components/common/Modal';
import { DifficultyBadge } from '../components/common/Badge';

export const QuizPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Chế độ: Thi thử ('exam') vs Ôn luyện tức thì ('study')
  const [learningMode, setLearningMode] = useState<'exam' | 'study'>('exam');

  // Chế độ đang làm lại câu sai
  const [isWrongOnlyMode, setIsWrongOnlyMode] = useState(false);

  // Ngữ cảnh Lớp học & Bài kiểm tra của giáo viên
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');
  const [assignment, setAssignment] = useState<ClassAssignment | null>(null);

  // Anti-Cheat (Chống gian lận / khóa chuyển tab)
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      const foundAsg = getAssignmentById(assignmentId);
      if (foundAsg) {
        setAssignment(foundAsg);
        if (foundAsg.type === 'exam') {
          setLearningMode('exam');
        }
      }
    }
  }, [assignmentId]);

  // Giám sát học sinh rời tab khi làm bài kiểm tra chính thức
  useEffect(() => {
    if (isSubmitted || !assignment?.preventTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);
          const maxAllowed = assignment.maxTabSwitchViolations || 3;
          const isAutoSubmit = next >= maxAllowed;

          // CẢNH BÁO TỨC THÌ VỀ PHÍA GIÁO VIÊN
          const user = getCurrentUser();
          recordStudentTabViolation({
            assignmentId: assignment.id,
            classId: assignment.classId,
            studentName: user.fullName,
            studentEmail: user.email,
            violationCount: next,
            maxViolations: maxAllowed,
            autoSubmitted: isAutoSubmit,
          });

          if (isAutoSubmit) {
            // Tự động thu bài khi vi phạm vượt ngưỡng
            setTimeout(() => {
              handleConfirmSubmit(true);
            }, 800);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSubmitted, assignment]);

  useEffect(() => {
    if (!id) return;
    const found = getQuizSetById(id);
    if (found) {
      setQuizSet(found);
      setActiveQuestions(found.questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setFlaggedQuestions({});
      setIsSubmitted(false);
      setSecondsElapsed(0);
      setIsWrongOnlyMode(false);
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

  const currentUser = getCurrentUser();

  // RÀNG BUỘC: Giáo viên không làm bài kiểm tra được giao mà chuyển sang trang Giám Sát Phòng Thi
  if (currentUser.role === 'teacher' && assignmentId) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
            Quyền Hạn Giáo Viên / Giảng Viên
          </span>
          <h2 className="text-2xl font-black text-slate-900 pt-2">
            Đây là bài thi do bạn phụ trách
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Giáo viên không trực tiếp làm bài thi này. Vui lòng chuyển sang <strong>Phòng Giám Sát Trực Tiếp</strong> để theo dõi tiến độ sinh viên, kiểm tra bảng điểm và nhận cảnh báo khi học sinh vi phạm chuyển tab.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/app/classes?monitor=${assignmentId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102"
          >
            <Eye className="w-4 h-4" />
            <span>Mở Bảng Giám Sát Phòng Thi Trực Tiếp</span>
          </Link>
          <Link
            to="/app/classes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            <span>Quay lại Quản lý Lớp học</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = activeQuestions[currentIndex];
  const totalQuestions = activeQuestions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const toggleFlagQuestion = (idx: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
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
  const handleConfirmSubmit = (isAutoViolation = false) => {
    setIsConfirmModalOpen(false);
    setShowTabWarning(false);
    setIsSubmitted(true);

    let correctCount = 0;
    const answerLogs = activeQuestions.map((q, idx) => {
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

    // Ghi nhận lần làm bài cá nhân
    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizSetId: quizSet.id,
      quizTitle: isWrongOnlyMode ? `${quizSet.title} (Ôn câu sai)` : quizSet.title,
      score: scorePercent,
      correctCount,
      totalQuestions,
      completedAt: new Date().toLocaleString('vi-VN'),
      durationSeconds: secondsElapsed,
      answers: answerLogs,
    };
    recordQuizAttempt(attempt);

    // NẾU LÀ BÀI THI/BÀI ÔN CỦA LỚP HỌC: BÁO CÁO VỀ CHO GIÁO VIÊN BIẾT
    if (assignment) {
      const currentUser = getCurrentUser();
      recordStudentSubmission({
        assignmentId: assignment.id,
        classId: assignment.classId,
        className: assignment.className,
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        studentEmail: currentUser.email,
        score: scorePercent,
        correctCount,
        totalQuestions,
        durationSeconds: secondsElapsed,
        tabSwitchCount,
        status: isAutoViolation ? 'violation_auto_submitted' : 'submitted',
      });
    }

    if (scorePercent >= 80) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  };

  // Làm lại từ đầu toàn bộ
  const handleRestartAll = () => {
    if (!quizSet) return;
    setActiveQuestions(quizSet.questions);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setSecondsElapsed(0);
    setReviewFilter('all');
    setIsWrongOnlyMode(false);
  };

  // Luyện tập lại CHỈ các câu làm sai
  const handleRetakeWrongOnly = () => {
    const wrongQuestions = activeQuestions.filter((q, idx) => {
      return selectedAnswers[idx] !== q.correctAnswerIndex;
    });

    if (wrongQuestions.length === 0) return;

    setActiveQuestions(wrongQuestions);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setSecondsElapsed(0);
    setReviewFilter('all');
    setIsWrongOnlyMode(true);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Thống kê kết quả
  const correctCount = activeQuestions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctAnswerIndex ? acc + 1 : acc;
  }, 0);
  const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const incorrectCount = totalQuestions - correctCount;

  // Lọc câu hỏi ở chế độ xem lại
  const filteredQuestionIndices = activeQuestions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => {
      const isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
      if (reviewFilter === 'incorrect') return !isCorrect;
      if (reviewFilter === 'correct') return isCorrect;
      return true;
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={quizSet.difficulty} />
              {assignment && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Lớp: {assignment.className}
                </span>
              )}
              {assignment?.preventTabSwitch && (
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 border ${
                  tabSwitchCount > 0
                    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Khóa chuyển tab: {tabSwitchCount}/{assignment.maxTabSwitchViolations}</span>
                </span>
              )}
              {isWrongOnlyMode && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Chế độ: Ôn câu làm sai
                </span>
              )}
              <span className="text-xs text-slate-400">Nguồn: {quizSet.sourceDocumentName}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {quizSet.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            {!isSubmitted ? (
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102"
              >
                Nộp bài ({answeredCount}/{totalQuestions})
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="In kết quả bài làm"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRestartAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector and Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLearningMode('exam')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                learningMode === 'exam'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thi thử (Tính điểm)</span>
            </button>
            <button
              type="button"
              onClick={() => setLearningMode('study')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                learningMode === 'study'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ôn luyện (Hiện giải thích ngay)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tiến độ: <strong className="text-slate-800">{answeredCount}/{totalQuestions} câu</strong> ({progressPercent}%)
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Numbers Quick Navigator */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-400 mr-1">Câu hỏi:</span>
          {activeQuestions.map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = currentIndex === idx;
            const isFlagged = flaggedQuestions[idx];

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white'
                    : isAnswered
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode 1: During Quiz (Đang làm bài) */}
      {!isSubmitted && currentQuestion && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Question Header & Bookmark button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Câu hỏi {currentIndex + 1} trên {totalQuestions}
            </span>

            <button
              type="button"
              onClick={() => toggleFlagQuestion(currentIndex)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                flaggedQuestions[currentIndex]
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${flaggedQuestions[currentIndex] ? 'fill-current' : ''}`} />
              <span>{flaggedQuestions[currentIndex] ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu này'}</span>
            </button>
          </div>

          {/* Question Text */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Options Grid */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              const hasAnswered = selectedAnswers[currentIndex] !== undefined;
              const isCorrectAnswer = optIdx === currentQuestion.correctAnswerIndex;
              const optionLetter = String.fromCharCode(65 + optIdx);

              // Phân định giao diện theo chế độ Ôn luyện (Study) hay Thi thử (Exam)
              let buttonStyle = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700';
              let badgeStyle = 'bg-slate-100 text-slate-600 group-hover:bg-slate-200';

              if (learningMode === 'study' && hasAnswered) {
                if (isCorrectAnswer) {
                  buttonStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-500 shadow-sm';
                  badgeStyle = 'bg-emerald-600 text-white';
                } else if (isSelected && !isCorrectAnswer) {
                  buttonStyle = 'border-rose-500 bg-rose-50/80 text-rose-950 font-semibold ring-1 ring-rose-500 shadow-sm';
                  badgeStyle = 'bg-rose-600 text-white';
                } else {
                  buttonStyle = 'border-slate-200 bg-white opacity-60 text-slate-500 cursor-not-allowed';
                }
              } else if (isSelected) {
                buttonStyle = 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-sm ring-1 ring-indigo-600';
                badgeStyle = 'bg-indigo-600 text-white';
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={learningMode === 'study' && hasAnswered}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group ${buttonStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                  >
                    {optionLetter}
                  </span>
                  <span className="text-sm leading-relaxed pt-0.5 flex-1">{opt}</span>

                  {learningMode === 'study' && hasAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                  )}
                  {learningMode === 'study' && hasAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hộp giải thích tức thì trong Chế độ Ôn luyện */}
          {learningMode === 'study' && selectedAnswers[currentIndex] !== undefined && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-slate-800 space-y-2 animate-fadeIn shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className={selectedAnswers[currentIndex] === currentQuestion.correctAnswerIndex ? 'text-emerald-700' : 'text-rose-700'}>
                  {selectedAnswers[currentIndex] === currentQuestion.correctAnswerIndex
                    ? '🎉 Xuất sắc! Bạn đã chọn đáp án chính xác'
                    : `❌ Chưa đúng! Đáp án đúng là: ${String.fromCharCode(65 + currentQuestion.correctAnswerIndex)}. ${currentQuestion.options[currentQuestion.correctAnswerIndex]}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <strong className="font-semibold text-slate-900">Giải thích chi tiết: </strong>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
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
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
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
          {/* Summary Score Card */}
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
                        ? 'Xuất sắc! Bạn nắm bài rất vững'
                        : scorePercent >= 50
                        ? 'Khá tốt! Hãy ôn lại các câu chưa đúng'
                        : 'Cần ôn tập kỹ hơn tài liệu này'}
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

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-center sm:justify-end">
                {incorrectCount > 0 && (
                  <button
                    type="button"
                    onClick={handleRetakeWrongOnly}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Luyện lại {incorrectCount} câu sai
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRestartAll}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Làm lại toàn bộ
                </button>
                <Link
                  to="/app/quiz-sets"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Kho đề thi
                </Link>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" />
                <span>Xem chi tiết:</span>
              </span>
              <button
                type="button"
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
                type="button"
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  reviewFilter === 'incorrect'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Chỉ câu sai ({incorrectCount})
              </button>
              <button
                type="button"
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
        title="Xác nhận nộp bài thi"
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
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Tiếp tục làm
            </button>
            <button
              type="button"
              onClick={() => handleConfirmSubmit(false)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              Xác nhận nộp
            </button>
          </div>
        </div>
      </Modal>

      {/* Anti-Cheat Tab Switch Warning Popup */}
      {showTabWarning && assignment?.preventTabSwitch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 border-2 border-rose-500 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8 text-rose-600 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-rose-700 tracking-tight">
                CẢNH BÁO VI PHẠM QUY CHẾ THI!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống phát hiện bạn vừa rời khỏi màn hình làm bài kiểm tra. Hành vi này đã được ghi nhận và báo cáo trực tiếp về tài khoản của Giáo viên!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-1">
              <div>Số lần vi phạm: <span className="text-base font-black text-rose-600">{tabSwitchCount}</span> / {assignment.maxTabSwitchViolations || 3} lần</div>
              <div className="text-[11px] font-normal text-slate-500">
                {tabSwitchCount >= (assignment.maxTabSwitchViolations || 3)
                  ? '⚠️ Bạn đã vi phạm quá giới hạn cho phép. Bài thi đang tự động thu hồi!'
                  : 'Nếu tiếp tục rời khỏi màn hình thi, bài làm sẽ tự động bị khóa và nộp về cho giáo viên.'}
              </div>
            </div>

            {tabSwitchCount < (assignment.maxTabSwitchViolations || 3) && (
              <button
                type="button"
                onClick={() => setShowTabWarning(false)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all hover:scale-102"
              >
                Tôi cam kết không vi phạm và tiếp tục làm bài
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
