import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Send,
  AlertCircle,
  Check
} from 'lucide-react';
import { getCurrentUser, type UserProfile } from '../services/auth';
import {
  startAssessmentAttempt,
  saveAttemptAnswers,
  submitAssessmentAttempt,
  handleExpiredAttempt,
} from '../services/assessmentService';
import { recordStudentTabViolation } from '../services/classService';
import type { AssessmentAttempt, QuestionType } from '../types';
import { Modal } from '../components/common/Modal';

interface SafeQuestion {
  id: string;
  originalQuestionId: string;
  order: number;
  content: string;
  type: QuestionType;
  options?: string[];
  points: number;
}

export const TakeAssessmentPage = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentUser] = useState<UserProfile>(getCurrentUser());
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Answers State: map questionId -> { selectedAnswer?, selectedAnswers?, essayAnswer? }
  const [studentAnswers, setStudentAnswers] = useState<
    Record<string, { selectedAnswer?: number; selectedAnswers?: number[]; essayAnswer?: string }>
  >({});

  // Timer & Deadline state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Auto-save feedback
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa xong');

  // Anti-cheat / Tab switch violations
  const [tabViolations, setTabViolations] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Modals & submission state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<any>(null);
  const answersRef = useRef(studentAnswers);
  answersRef.current = studentAnswers;

  // 1. Khởi tạo phiên làm bài thi từ Backend
  useEffect(() => {
    if (!assessmentId) return;

    const res = startAssessmentAttempt(assessmentId);
    if (!res.success) {
      setInitError(res.error.message);
      return;
    }

    const { attempt: att, questions: qList } = res.data;
    setAttempt(att);
    setQuestions(qList as SafeQuestion[]);

    // Khôi phục câu trả lời đã lưu nếu là phiên khôi phục
    if (att.answers) {
      const restored: Record<string, any> = {};
      Object.keys(att.answers).forEach((k) => {
        restored[k] = {
          selectedAnswer: att.answers[k].selectedAnswer,
          selectedAnswers: att.answers[k].selectedAnswers,
          essayAnswer: att.answers[k].essayAnswer,
        };
      });
      setStudentAnswers(restored);
    }

    setTabViolations(att.tabSwitchCount || 0);

    // Tính toán thời gian còn lại từ deadline do Backend kiểm soát
    const deadlineMs = new Date(att.deadlineAt).getTime();
    const nowMs = Date.now();
    const diffSecs = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
    setRemainingSeconds(diffSecs);
  }, [assessmentId]);

  // 2. Đồng hồ đếm ngược đồng bộ Backend
  useEffect(() => {
    if (remainingSeconds === null || isTimeUp) return;

    if (remainingSeconds <= 0) {
      setIsTimeUp(true);
      handleAutoSubmitOnTimeOut();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          handleAutoSubmitOnTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, isTimeUp]);

  // 3. Tự động lưu định kỳ mỗi 8 giây
  useEffect(() => {
    if (!attempt || attempt.status !== 'taking') return;

    autoSaveTimerRef.current = setInterval(() => {
      triggerAutoSave();
    }, 8000);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [attempt]);

  const triggerAutoSave = () => {
    if (!attempt || attempt.status !== 'taking') return;
    setSaveStatus('saving');

    const res = saveAttemptAnswers(attempt.id, answersRef.current);
    if (res.success) {
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
    } else {
      setSaveStatus('error');
    }
  };

  // 4. Giám sát chống gian lận chuyển tab
  useEffect(() => {
    if (!attempt || attempt.status !== 'taking') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);
          const maxAllowed = 3;
          const isAutoSubmit = next >= maxAllowed;

          recordStudentTabViolation({
            assignmentId: attempt.assessmentId,
            classId: attempt.classId,
            studentName: currentUser.fullName,
            studentEmail: currentUser.email,
            violationCount: next,
            maxViolations: maxAllowed,
            autoSubmitted: isAutoSubmit,
          });

          if (isAutoSubmit) {
            handleConfirmSubmit(true);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attempt, currentUser]);

  // Hết giờ tự động nộp
  const handleAutoSubmitOnTimeOut = () => {
    if (!attempt) return;
    handleExpiredAttempt(attempt.id);
    alert('Thời gian làm bài thi đã kết thúc! Hệ thống đã tự động thu bài.');
    navigate(`/app/classes?assignmentId=${attempt.assessmentId}`);
  };

  // Nộp bài
  const handleConfirmSubmit = (_isViolationSubmit = false) => {
    if (!attempt) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const res = submitAssessmentAttempt(attempt.id, answersRef.current);
    setIsSubmitting(false);

    if (!res.success) {
      setSubmitError(res.error.message);
      return;
    }

    setIsSubmitModalOpen(false);
    navigate(`/app/classes?assignmentId=${attempt.assessmentId}&submitted=true`);
  };

  // Thao tác chọn đáp án
  const handleSelectSingle = (questionId: string, optIdx: number) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedAnswer: optIdx,
      },
    }));
  };

  const handleToggleMultiple = (questionId: string, optIdx: number) => {
    setStudentAnswers((prev) => {
      const current = prev[questionId]?.selectedAnswers || [];
      const updated = current.includes(optIdx)
        ? current.filter((i) => i !== optIdx)
        : [...current, optIdx];

      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          selectedAnswers: updated,
        },
      };
    });
  };

  const handleEssayChange = (questionId: string, text: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        essayAnswer: text,
      },
    }));
  };

  // Thống kê tiến độ trả lời
  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const ans = studentAnswers[q.id];
      if (!ans) return false;
      if (q.type === 'single_choice' || q.type === 'true_false') {
        return ans.selectedAnswer !== undefined;
      }
      if (q.type === 'multiple_choice') {
        return ans.selectedAnswers && ans.selectedAnswers.length > 0;
      }
      if (q.type === 'essay') {
        return ans.essayAnswer && ans.essayAnswer.trim().length > 0;
      }
      return false;
    }).length;
  }, [questions, studentAnswers]);

  // Format Timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (initError) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white border border-rose-200 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không thể bắt đầu bài làm</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{initError}</p>
        <button
          onClick={() => navigate('/app/classes')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
        >
          Quay lại danh sách lớp học
        </button>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Đang tải đề thi và chuẩn bị phòng thi an toàn...</span>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = studentAnswers[currentQ?.id];

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Top Bar: Title, Timer, Auto-Save Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-2 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {attempt.className}
            </span>
            <span className="text-xs text-slate-400">• Thí sinh: {attempt.studentName}</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 mt-0.5">
            Bài kiểm tra trực tuyến: {attempt.className}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Auto-Save Indicator */}
          <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            {saveStatus === 'saving' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-700 font-semibold">Đang lưu...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Đã lưu ({lastSavedTime})</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-600">Lỗi lưu mạng</span>
              </>
            )}
          </div>

          {/* Countdown Clock */}
          {remainingSeconds !== null && (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black shadow-xs ${
                remainingSeconds < 300
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Nộp bài
          </button>
        </div>
      </div>

      {/* Tab Switch Warning Banner */}
      {showTabWarning && (
        <div className="p-4 bg-gradient-to-r from-rose-600 to-red-700 text-white rounded-2xl shadow-md border border-rose-500 flex items-center justify-between gap-4 animate-shake">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">
                CẢNH BÁO VI PHẠM THI CỬ: BẠN VỪA RỜI KHỎI MÀN HÌNH BÀI THI!
              </div>
              <div className="text-xs text-rose-100 mt-0.5">
                Số lần vi phạm: <strong>{tabViolations}/3 lần</strong>. Nếu vi phạm 3 lần, hệ thống sẽ tự động khóa bài thi và nộp điểm hiện tại về giáo viên.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowTabWarning(false)}
            className="px-3 py-1.5 bg-white text-rose-800 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors shrink-0"
          >
            Tôi đã hiểu
          </button>
        </div>
      )}

      {/* Main Layout: Question Content & Navigator Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Active Question */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-black text-indigo-600 text-sm">
                  CÂU HỎI {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">
                  {currentQ.type === 'single_choice' && 'Trắc nghiệm 1 đáp án'}
                  {currentQ.type === 'multiple_choice' && 'Nhiều đáp án đúng'}
                  {currentQ.type === 'true_false' && 'Đúng / Sai'}
                  {currentQ.type === 'essay' && 'Tự luận'}
                </span>
              </div>

              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {currentQ.points} điểm
              </span>
            </div>

            {/* Question Text */}
            <p className="text-base font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
              {currentQ.content}
            </p>

            {/* Answer Options */}
            <div className="pt-2">
              {/* Single Choice */}
              {currentQ.type === 'single_choice' && currentQ.options && (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = currentAnswer?.selectedAnswer === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectSingle(currentQ.id, optIdx)}
                        className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Multiple Choice */}
              {currentQ.type === 'multiple_choice' && currentQ.options && (
                <div className="space-y-2.5">
                  <div className="text-xs text-purple-700 font-semibold mb-2">
                    * Bạn có thể chọn một hoặc nhiều đáp án đúng:
                  </div>
                  {currentQ.options.map((opt, optIdx) => {
                    const isChecked = currentAnswer?.selectedAnswers?.includes(optIdx);
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleToggleMultiple(currentQ.id, optIdx)}
                        className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-purple-50 border-purple-400 text-purple-950 font-semibold shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isChecked ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isChecked && <Check className="w-4 h-4 text-purple-600" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True / False */}
              {currentQ.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div
                    onClick={() => handleSelectSingle(currentQ.id, 0)}
                    className={`p-4 rounded-2xl border text-center font-bold text-sm cursor-pointer transition-all ${
                      currentAnswer?.selectedAnswer === 0
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    ĐÚNG
                  </div>
                  <div
                    onClick={() => handleSelectSingle(currentQ.id, 1)}
                    className={`p-4 rounded-2xl border text-center font-bold text-sm cursor-pointer transition-all ${
                      currentAnswer?.selectedAnswer === 1
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    SAI
                  </div>
                </div>
              )}

              {/* Essay */}
              {currentQ.type === 'essay' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Phần trình bày bài làm của bạn:
                  </label>
                  <textarea
                    rows={8}
                    value={currentAnswer?.essayAnswer || ''}
                    onChange={(e) => handleEssayChange(currentQ.id, e.target.value)}
                    placeholder="Trình bày lời giải chi tiết, các bước giải toán hoặc luận điểm của bạn tại đây..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y leading-relaxed"
                  />
                  <div className="text-right text-[11px] text-slate-400">
                    {(currentAnswer?.essayAnswer || '').trim().split(/\s+/).filter(Boolean).length} từ
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Câu trước
            </button>

            <span className="text-xs text-slate-400 font-semibold">
              Câu {currentIndex + 1} / {questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Câu tiếp theo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                Hoàn thành & Nộp bài
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Question Palette Navigator */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 h-fit sticky top-24">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Danh sách câu hỏi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đã trả lời: <strong className="text-emerald-600">{answeredCount}</strong> / {questions.length} câu
            </p>
          </div>

          {/* Grid of numbers */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const ans = studentAnswers[q.id];
              let isAnswered = false;
              if (q.type === 'single_choice' || q.type === 'true_false') {
                isAnswered = ans?.selectedAnswer !== undefined;
              } else if (q.type === 'multiple_choice') {
                isAnswered = Boolean(ans?.selectedAnswers && ans.selectedAnswers.length > 0);
              } else if (q.type === 'essay') {
                isAnswered = Boolean(ans?.essayAnswer && ans.essayAnswer.trim().length > 0);
              }

              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full aspect-square rounded-xl text-xs font-bold transition-all border ${
                    isCurrent
                      ? 'ring-2 ring-indigo-500 border-indigo-500'
                      : ''
                  } ${
                    isAnswered
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-300" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200" />
              <span>Chưa trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded ring-2 ring-indigo-500 border border-indigo-500" />
              <span>Đang xem</span>
            </div>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Nộp bài thi
          </button>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Xác nhận nộp bài thi"
      >
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {submitError}
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tổng số câu hỏi:</span>
              <strong className="text-slate-900">{questions.length} câu</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Đã trả lời:</span>
              <strong className="text-emerald-700">{answeredCount} câu</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Chưa trả lời:</span>
              <strong className="text-rose-700">{questions.length - answeredCount} câu</strong>
            </div>
          </div>

          {questions.length - answeredCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Bạn vẫn còn <strong>{questions.length - answeredCount} câu chưa trả lời</strong>. Các câu bỏ trống sẽ được tính 0 điểm.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Sau khi nộp bài, bạn sẽ không thể chỉnh sửa đáp án hoặc làm lại bài thi này. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Tiếp tục làm bài
            </button>
            <button
              onClick={() => handleConfirmSubmit(false)}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp bài'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
