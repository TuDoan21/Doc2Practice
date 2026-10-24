import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  Calendar,
  Play,
  Eye,
  PlusCircle,
  Trash2,
  Printer,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import {
  getQuizSets,
  deleteQuizSet,
  saveQuizSet,
  exportQuizSetJson,
  exportQuizSetCsv,
  importQuizSetJson
} from '../services/storage';
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

  // Modals
  const [previewingQuiz, setPreviewingQuiz] = useState<QuizSet | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<QuizSet | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<QuizSet | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const refreshList = () => {
    setQuizSets(getQuizSets());
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importQuizSetJson(text);
        refreshList();
        setImportStatus(`Đã nhập thành công bộ đề: "${imported.title}" (${imported.questionCount} câu)`);
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi nhập file JSON. Vui lòng kiểm tra lại định dạng file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Xóa bộ câu hỏi
  const handleDeleteConfirm = () => {
    if (!deletingQuiz) return;
    deleteQuizSet(deletingQuiz.id);
    setDeletingQuiz(null);
    refreshList();
  };

  // Mở modal sửa
  const handleOpenEdit = (quiz: QuizSet) => {
    setEditingQuiz(quiz);
    setEditTitle(quiz.title);
    setEditDesc(quiz.description);
  };

  // Lưu sửa
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz || !editTitle.trim()) return;

    const updated: QuizSet = {
      ...editingQuiz,
      title: editTitle.trim(),
      description: editDesc.trim(),
    };
    saveQuizSet(updated);
    setEditingQuiz(null);
    refreshList();
  };

  // In đề thi (Print view)
  const handlePrintExam = () => {
    window.print();
  };

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
            Tổng hợp các bộ đề trắc nghiệm thông minh đã tạo từ tài liệu học tập.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs cursor-pointer transition-all hover:scale-102">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Nhập đề thi (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <Link
            to="/app/create-quiz"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo bộ câu hỏi mới</span>
          </Link>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

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
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
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
                  <div className="flex items-center gap-1">
                    {quiz.lastScore !== undefined && quiz.lastScore !== null && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {quiz.lastScore}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(quiz)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Chỉnh sửa bộ đề"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingQuiz(quiz)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa bộ đề"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewingQuiz(quiz)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem đề thi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportQuizSetJson(quiz)}
                    title="Xuất ra file JSON"
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

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

      {/* Preview & Print Modal */}
      <Modal
        isOpen={Boolean(previewingQuiz)}
        onClose={() => setPreviewingQuiz(null)}
        title={previewingQuiz ? `Đề thi: ${previewingQuiz.title}` : ''}
        maxWidth="xl"
      >
        {previewingQuiz && (
          <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1 print:max-h-none">
            {/* Header thông tin đề thi */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-4">
              <div className="text-xs text-indigo-950 space-y-1">
                <p><span className="font-bold">Tài liệu:</span> {previewingQuiz.sourceDocumentName}</p>
                <p><span className="font-bold">Số lượng:</span> {previewingQuiz.questions.length} câu hỏi • Mức độ: {previewingQuiz.difficulty}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportQuizSetJson(previewingQuiz)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-bold shadow-xs transition-all hover:bg-slate-50"
                  title="Tải file JSON để sao lưu hoặc chia sẻ"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xuất JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportQuizSetCsv(previewingQuiz)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-700 hover:text-emerald-600 border border-slate-200 text-xs font-bold shadow-xs transition-all hover:bg-slate-50"
                  title="Tải file CSV/TSV chuẩn để nhập vào Anki hoặc Quizlet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Anki</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintExam}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all hover:scale-105"
                >
                  <Printer className="w-4 h-4" />
                  <span>In đề thi</span>
                </button>
              </div>
            </div>

            {/* Danh sách câu hỏi */}
            <div className="space-y-4">
              {previewingQuiz.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                      Câu {idx + 1}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-700 flex items-start gap-2"
                      >
                        <span className="font-bold text-indigo-600 shrink-0">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bảng đáp án & Giải thích ở cuối đề */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bảng tra cứu đáp án & Lời giải:</span>
              </div>
              <div className="space-y-2">
                {previewingQuiz.questions.map((q, idx) => (
                  <div key={idx} className="pb-2 border-b border-slate-200/60 last:border-none">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span>Câu {idx + 1}: Đáp án {String.fromCharCode(65 + q.correctAnswerIndex)}</span>
                    </div>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{q.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewingQuiz(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Đóng
              </button>
              <Link
                to={`/app/quiz/${previewingQuiz.id}`}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-102 flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Bắt đầu làm bài</span>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Chỉnh sửa bộ đề */}
      <Modal
        isOpen={Boolean(editingQuiz)}
        onClose={() => setEditingQuiz(null)}
        title="Chỉnh sửa thông tin bộ câu hỏi"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Tiêu đề bộ đề
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Mô tả / Ghi chú
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingQuiz(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận Xóa bộ đề */}
      <Modal
        isOpen={Boolean(deletingQuiz)}
        onClose={() => setDeletingQuiz(null)}
        title="Xác nhận xóa bộ câu hỏi"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Xóa bộ câu hỏi này?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bộ đề <span className="font-semibold text-slate-800">{deletingQuiz?.title}</span> sẽ bị xóa vĩnh viễn khỏi danh sách luyện tập của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeletingQuiz(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
            >
              Xóa bộ đề
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
