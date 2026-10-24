import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  RotateCcw,
  Calendar,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  BarChart3,
  Zap,
  Sparkles
} from 'lucide-react';
import {
  getHistory,
  deleteHistoryAttempt,
  clearAllHistory,
  getUniqueMistakes,
  createMistakeBankQuizSet
} from '../services/storage';
import type { QuizAttempt } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const HistoryPage = () => {
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const refreshHistory = () => {
    setHistory(getHistory());
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const navigate = useNavigate();
  const mistakes = getUniqueMistakes();

  const handleStartMistakePractice = () => {
    const newQuiz = createMistakeBankQuizSet();
    if (newQuiz) {
      navigate(`/app/quiz/${newQuiz.id}`);
    } else {
      alert('Hiện bạn chưa có câu hỏi nào làm sai. Rất tuyệt vời!');
    }
  };

  const handleDeleteOne = (id: string) => {
    if (window.confirm('Xóa bản ghi lịch sử này?')) {
      deleteHistoryAttempt(id);
      refreshHistory();
    }
  };

  const handleClearAll = () => {
    clearAllHistory();
    setShowClearAllModal(false);
    refreshHistory();
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    if (mins === 0) return `${s} giây`;
    return `${mins} phút ${s} giây`;
  };

  // Thống kê nhanh
  const totalAttempts = history.length;
  const perfectScores = history.filter((h) => h.score === 100).length;
  const totalSeconds = history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lịch sử luyện tập
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi hành trình ôn thi và chi tiết từng bài làm trắc nghiệm của bạn.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearAllModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa toàn bộ lịch sử</span>
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Số lượt luyện tập</div>
              <div className="text-xl font-extrabold text-slate-900">{totalAttempts} lần</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Lượt đạt điểm tuyệt đối</div>
              <div className="text-xl font-extrabold text-emerald-600">{perfectScores} lần (100%)</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Tổng thời gian luyện</div>
              <div className="text-xl font-extrabold text-slate-900">{formatDuration(totalSeconds)}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Câu sai tích lũy</div>
              <div className="text-xl font-extrabold text-amber-600">{mistakes.length} câu</div>
            </div>
          </div>
        </div>
      )}

      {/* Mistake Bank Banner */}
      {mistakes.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-fadeIn">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Zap className="w-4 h-4 text-amber-600 fill-current" />
              <span>Ngân hàng câu hỏi sai thông minh (Mistake Bank)</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Hệ thống phát hiện {mistakes.length} câu hỏi bạn từng làm sai
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Tạo ngay một bộ đề luyện tập chuyên biệt chứa các câu hỏi này để khắc phục triệt để lỗ hổng kiến thức trước kỳ thi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartMistakePractice}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all hover:scale-102 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Luyện tập {mistakes.length} câu sai ngay</span>
          </button>
        </div>
      )}

      {/* History List */}
      {history.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {history.map((att) => (
              <div
                key={att.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors group"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                      att.score >= 80
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : att.score >= 50
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    <span className="text-base leading-none">{att.score}%</span>
                    <span className="text-[9px] font-semibold uppercase mt-0.5">
                      {att.correctCount}/{att.totalQuestions}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                      {att.quizTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{att.completedAt}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(att.durationSeconds)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {att.answers && att.answers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAttempt(att)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem kết quả</span>
                    </button>
                  )}

                  <Link
                    to={`/app/quiz/${att.quizSetId}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Thi lại</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteOne(att.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Xóa lượt này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Chưa có lịch sử làm bài"
          description="Hãy chọn một bộ câu hỏi để luyện tập và theo dõi tiến độ của bạn tại đây."
          actionText="Khám phá bộ đề thi"
          onAction={() => {}}
        />
      )}

      {/* Modal Xem chi tiết bài làm */}
      <Modal
        isOpen={Boolean(selectedAttempt)}
        onClose={() => setSelectedAttempt(null)}
        title={selectedAttempt ? `Kết quả: ${selectedAttempt.quizTitle}` : ''}
        maxWidth="md"
      >
        {selectedAttempt && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">Điểm số: {selectedAttempt.score}%</p>
                <p className="text-slate-400">Thời gian làm: {formatDuration(selectedAttempt.durationSeconds)}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                Đúng {selectedAttempt.correctCount}/{selectedAttempt.totalQuestions} câu
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chi tiết câu trả lời:
              </h4>
              {selectedAttempt.answers?.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    ans.isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Câu {idx + 1}:</span>
                    <span>Phương án chọn: {ans.selectedIndex >= 0 ? String.fromCharCode(65 + ans.selectedIndex) : 'Bỏ qua'}</span>
                  </div>
                  {ans.isCorrect ? (
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đúng</span>
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      <span>Sai</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Xác nhận Xóa tất cả */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Xóa toàn bộ lịch sử luyện tập"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Bạn có chắc chắn muốn xóa?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tất cả lịch sử làm bài và điểm số tích lũy sẽ bị xóa khỏi trình duyệt. Thao tác này không thể hoàn tác.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowClearAllModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
