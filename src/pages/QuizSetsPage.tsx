import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  Calendar,
  Play,
  Eye,
  PlusCircle
} from 'lucide-react';
import { getQuizSets } from '../services/storage';
import type { QuizSet, DifficultyLevel } from '../types';
import { DifficultyBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const QuizSetsPage = () => {
  const [searchParams] = useSearchParams();
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | DifficultyLevel>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'score' | 'questions'>('newest');

  // Preview Modal
  const [previewingQuiz, setPreviewingQuiz] = useState<QuizSet | null>(null);

  useEffect(() => {
    setQuizSets(getQuizSets());
  }, []);

  // Update searchQuery if url param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Filter & Sort logic
  const filteredSets = useMemo(() => {
    return quizSets
      .filter((set) => {
        const matchesQuery =
          set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          set.sourceDocumentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          set.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDifficulty =
          difficultyFilter === 'all' || set.difficulty === difficultyFilter;

        return matchesQuery && matchesDifficulty;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'score') {
          return (b.lastScore ?? -1) - (a.lastScore ?? -1);
        }
        if (sortBy === 'questions') {
          return b.questionCount - a.questionCount;
        }
        return 0;
      });
  }, [quizSets, searchQuery, difficultyFilter, sortBy]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kho bộ câu hỏi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp các bộ đề trắc nghiệm đã tạo từ tài liệu học tập.
          </p>
        </div>

        <Link
          to="/app/create-quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all hover:scale-102 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo bộ câu hỏi mới</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, tài liệu nguồn..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Độ khó:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Tất cả độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="newest">Mới nhất</option>
              <option value="score">Điểm số cao nhất</option>
              <option value="questions">Số câu hỏi nhiều nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={quiz.difficulty} />
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {quiz.questionCount} câu hỏi
                    </span>
                  </div>
                  {quiz.lastScore !== undefined && quiz.lastScore !== null && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Điểm: {quiz.lastScore}%
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {quiz.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{quiz.sourceDocumentName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Ngày tạo: {quiz.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewingQuiz(quiz)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem câu hỏi</span>
                </button>

                <Link
                  to={`/app/quiz/${quiz.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Luyện tập</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không tìm thấy bộ câu hỏi nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc tạo một bộ câu hỏi mới từ tài liệu PDF của bạn."
          actionText="Tạo bộ câu hỏi ngay"
          onAction={() => setSearchQuery('')}
        />
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewingQuiz}
        onClose={() => setPreviewingQuiz(null)}
        title={previewingQuiz ? `Xem trước: ${previewingQuiz.title}` : ''}
        maxWidth="xl"
      >
        {previewingQuiz && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1">
              <p><span className="font-semibold text-slate-800">Tài liệu:</span> {previewingQuiz.sourceDocumentName}</p>
              <p><span className="font-semibold text-slate-800">Mô tả:</span> {previewingQuiz.description}</p>
            </div>

            <div className="space-y-3">
              {previewingQuiz.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
                  <div className="text-xs font-bold text-indigo-600">Câu {idx + 1}:</div>
                  <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border ${
                          oIdx === q.correctAnswerIndex
                            ? 'border-emerald-300 bg-emerald-50/60 font-semibold text-emerald-900'
                            : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Link
                to={`/app/quiz/${previewingQuiz.id}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
              >
                Bắt đầu làm bài thi
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

