import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { getHistory } from '../services/storage';
import type { QuizAttempt } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const HistoryPage = () => {
  const [history, setHistory] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins} phút ${s} giây`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lịch sử luyện tập
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi kết quả các bài kiểm tra trắc nghiệm bạn đã hoàn thành.
        </p>
      </div>

      {history.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {history.map((att) => (
              <div
                key={att.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
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
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
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

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <Link
                    to={`/app/quiz/${att.quizSetId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Luyện lại</span>
                  </Link>
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
    </div>
  );
};

