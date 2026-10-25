import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Copy,
  Trash2,
  Eye,
  Check,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { getCurrentUser, type UserProfile } from '../services/auth';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  cloneQuestion,
  deleteQuestion,
  importQuestionsFromData,
  type QuestionFilter,
  type CreateQuestionParams,
  type ImportResult,
} from '../services/questionBankService';
import { getSubjects } from '../services/subjectService';
import type {
  BankQuestion,
  QuestionType,
  QuestionScope,
  QuestionStatus,
  DifficultyLevel,
  Subject,
} from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const QuestionBankPage = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedScope, setSelectedScope] = useState<QuestionScope | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<QuestionStatus | 'all'>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<BankQuestion | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<BankQuestion | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Question Form State
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<QuestionType>('single_choice');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<number>(0);
  const [formCorrectAnswers, setFormCorrectAnswers] = useState<number[]>([0]);
  const [formSampleAnswer, setFormSampleAnswer] = useState('');
  const [formRubric, setFormRubric] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formGradeLevel, setFormGradeLevel] = useState('Khối 12');
  const [formTopic, setFormTopic] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('medium');
  const [formDefaultPoints, setFormDefaultPoints] = useState<number>(1.0);
  const [formScope, setFormScope] = useState<QuestionScope>('personal');
  const [formStatus, setFormStatus] = useState<QuestionStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);

  // Import State
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importSubjectId, setImportSubjectId] = useState('');
  const [importScope, setImportScope] = useState<QuestionScope>('personal');

  // Notification feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth_state_changed', handleAuth);
    return () => window.removeEventListener('auth_state_changed', handleAuth);
  }, []);

  const refreshData = () => {
    setLoading(true);
    const filter: QuestionFilter = {
      subjectId: selectedSubject,
      gradeLevel: selectedGrade,
      type: selectedType,
      difficulty: selectedDifficulty,
      scope: selectedScope,
      status: selectedStatus,
      search: searchQuery,
    };

    const res = getQuestions(filter);
    if (res.success) {
      setQuestions(res.data as BankQuestion[]);
    }

    const subList = getSubjects();
    setSubjects(subList.filter((s) => s.status === 'active'));
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [
    selectedSubject,
    selectedGrade,
    selectedType,
    selectedDifficulty,
    selectedScope,
    selectedStatus,
    searchQuery,
  ]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const resetForm = () => {
    setFormContent('');
    setFormType('single_choice');
    setFormOptions(['', '', '', '']);
    setFormCorrectAnswer(0);
    setFormCorrectAnswers([0]);
    setFormSampleAnswer('');
    setFormRubric('');
    setFormExplanation('');
    setFormSubjectId(subjects[0]?.id || '');
    setFormGradeLevel('Khối 12');
    setFormTopic('');
    setFormDifficulty('medium');
    setFormDefaultPoints(1.0);
    setFormScope('personal');
    setFormStatus('active');
    setFormError(null);
    setEditingQuestion(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (q: BankQuestion) => {
    setEditingQuestion(q);
    setFormContent(q.content);
    setFormType(q.type);
    setFormOptions(q.options && q.options.length > 0 ? [...q.options] : ['', '', '', '']);
    setFormCorrectAnswer(q.correctAnswer !== undefined ? q.correctAnswer : 0);
    setFormCorrectAnswers(q.correctAnswers && q.correctAnswers.length > 0 ? [...q.correctAnswers] : [0]);
    setFormSampleAnswer(q.sampleAnswer || '');
    setFormRubric(q.rubric || '');
    setFormExplanation(q.explanation || '');
    setFormSubjectId(q.subjectId || '');
    setFormGradeLevel(q.gradeLevel || 'Khối 12');
    setFormTopic(q.topic || '');
    setFormDifficulty(q.difficulty);
    setFormDefaultPoints(q.defaultPoints);
    setFormScope(q.scope);
    setFormStatus(q.status);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const subjectObj = subjects.find((s) => s.id === formSubjectId);

    const params: CreateQuestionParams = {
      content: formContent,
      type: formType,
      options: formType === 'essay' ? undefined : formOptions.filter((o) => o.trim().length > 0),
      correctAnswer: formType === 'single_choice' || formType === 'true_false' ? formCorrectAnswer : undefined,
      correctAnswers: formType === 'multiple_choice' ? formCorrectAnswers : undefined,
      sampleAnswer: formType === 'essay' ? formSampleAnswer : undefined,
      rubric: formType === 'essay' ? formRubric : undefined,
      explanation: formExplanation,
      subjectId: formSubjectId || undefined,
      subjectName: subjectObj?.name,
      gradeLevel: formGradeLevel,
      topic: formTopic,
      difficulty: formDifficulty,
      defaultPoints: formDefaultPoints,
      scope: formScope,
      status: formStatus,
    };

    if (editingQuestion) {
      const res = updateQuestion(editingQuestion.id, params);
      if (!res.success) {
        setFormError(res.error.message);
        return;
      }
      showFeedback(`Đã cập nhật câu hỏi thành công.`);
    } else {
      const res = createQuestion(params);
      if (!res.success) {
        setFormError(res.error.message);
        return;
      }
      showFeedback(`Đã thêm câu hỏi mới vào ngân hàng.`);
    }

    setIsCreateModalOpen(false);
    resetForm();
    refreshData();
  };

  const handleClone = (q: BankQuestion) => {
    const res = cloneQuestion(q.id);
    if (!res.success) {
      alert(`Lỗi: ${res.error.message}`);
      return;
    }
    showFeedback(`Đã nhân bản câu hỏi vào kho cá nhân.`);
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (!deletingQuestion) return;
    const res = deleteQuestion(deletingQuestion.id);
    if (!res.success) {
      alert(`Lỗi: ${res.error.message}`);
      return;
    }
    setDeletingQuestion(null);
    showFeedback('Đã xóa câu hỏi khỏi ngân hàng.');
    refreshData();
  };

  const handleToggleArchive = (q: BankQuestion) => {
    const nextStatus = q.status === 'archived' ? 'active' : 'archived';
    const res = updateQuestion(q.id, { status: nextStatus });
    if (!res.success) {
      alert(`Lỗi: ${res.error.message}`);
      return;
    }
    refreshData();
    showFeedback(`Đã chuyển trạng thái câu hỏi sang "${nextStatus === 'archived' ? 'Lưu trữ' : 'Kích hoạt'}".`);
  };

  // Import handler
  const handleParseImport = () => {
    if (!importText.trim()) return;
    try {
      let parsedRows: any[] = [];
      const trimmed = importText.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const obj = JSON.parse(trimmed);
        parsedRows = Array.isArray(obj) ? obj : [obj];
      } else {
        // Simple CSV parser
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('Tệp CSV cần ít nhất một dòng tiêu đề và một dòng dữ liệu.');
          return;
        }
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        parsedRows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const rowObj: any = {};
          headers.forEach((h, i) => {
            rowObj[h] = cols[i] || '';
          });
          return rowObj;
        });
      }

      const subjectObj = subjects.find((s) => s.id === importSubjectId);
      const res = importQuestionsFromData(
        parsedRows,
        {
          subjectId: importSubjectId || undefined,
          subjectName: subjectObj?.name,
          scope: importScope,
        },
        false // preview only
      );
      setImportResult(res);
    } catch (err: any) {
      alert(`Lỗi phân tích cú pháp tệp: ${err.message}`);
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || importResult.validCount === 0) return;
    try {
      let parsedRows: any[] = [];
      const trimmed = importText.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const obj = JSON.parse(trimmed);
        parsedRows = Array.isArray(obj) ? obj : [obj];
      } else {
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        parsedRows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const rowObj: any = {};
          headers.forEach((h, i) => {
            rowObj[h] = cols[i] || '';
          });
          return rowObj;
        });
      }

      const subjectObj = subjects.find((s) => s.id === importSubjectId);
      const res = importQuestionsFromData(
        parsedRows,
        {
          subjectId: importSubjectId || undefined,
          subjectName: subjectObj?.name,
          scope: importScope,
        },
        true // save to storage
      );

      setIsImportModalOpen(false);
      setImportText('');
      setImportResult(null);
      refreshData();
      showFeedback(`Đã nhập thành công ${res.validCount} câu hỏi vào ngân hàng.`);
    } catch (err: any) {
      alert(`Lỗi lưu dữ liệu: ${err.message}`);
    }
  };

  const sampleCSVTemplate = `Nội dung,Loại câu hỏi,Phương án A,Phương án B,Phương án C,Phương án D,Đáp án đúng,Điểm,Giải thích
Hàm số y = x^2 có cực tiểu tại điểm x bằng bao nhiêu?,single_choice,0,1,2,-1,A,1.0,y' = 2x = 0 khi x = 0
Những số nào sau đây là số nguyên tố?,multiple_choice,2,3,4,5,A;B;D,1.5,2 3 5 là các số nguyên tố
Mặt Trời mọc ở hướng Đông và lặn ở hướng Tây.,true_false,Đúng,Sai,0,0,Đúng,0.5,Quy luật tự nhiên của Trái Đất`;

  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'single_choice':
        return (
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Trắc nghiệm 1 đáp án
          </span>
        );
      case 'multiple_choice':
        return (
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            Nhiều đáp án đúng
          </span>
        );
      case 'true_false':
        return (
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Đúng / Sai
          </span>
        );
      case 'essay':
        return (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Tự luận
          </span>
        );
    }
  };

  const getDifficultyBadge = (d: DifficultyLevel) => {
    switch (d) {
      case 'easy':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Dễ</span>;
      case 'medium':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Trung bình</span>;
      case 'hard':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">Khó</span>;
    }
  };

  const getScopeBadge = (scope: QuestionScope) => {
    switch (scope) {
      case 'personal':
        return <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">🔒 Cá nhân</span>;
      case 'school_shared':
        return <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">🏫 Chia sẻ trường</span>;
      case 'global_shared':
        return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">🌐 Toàn quốc</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-indigo-600" />
            Ngân hàng câu hỏi
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản trị kho câu hỏi trắc nghiệm, tự luận, ma trận đề thi và chia sẻ trong tổ chuyên môn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/app/ai-generate"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Tạo bằng AI
          </Link>

          <button
            onClick={() => {
              setImportText(sampleCSVTemplate);
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Nhập file (CSV / JSON)
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi mới
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi, chuyên đề, đáp án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Subject */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Grade Level */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả khối lớp</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
              <option value="Đại học">Đại học</option>
            </select>

            {/* Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Mọi loại câu hỏi</option>
              <option value="single_choice">Trắc nghiệm 1 đáp án</option>
              <option value="multiple_choice">Nhiều đáp án đúng</option>
              <option value="true_false">Đúng / Sai</option>
              <option value="essay">Tự luận</option>
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Mọi mức độ</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>

            {/* Scope */}
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Mọi phạm vi</option>
              <option value="personal">Cá nhân</option>
              <option value="school_shared">Chia sẻ trường</option>
              <option value="global_shared">Toàn quốc</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Đang tải ngân hàng câu hỏi...</div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Không tìm thấy câu hỏi nào"
          description="Chưa có câu hỏi nào phù hợp với bộ lọc hiện tại. Bạn có thể tạo mới hoặc nhập hàng loạt từ file CSV/JSON."
          actionText="Tạo câu hỏi ngay"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-3.5">
          {questions.map((q, index) => {
            const isOwner = q.createdBy === currentUser.id;
            const canEdit = isOwner || currentUser.role === 'school_admin' || currentUser.role === 'system_admin';

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-3.5"
              >
                {/* Question Top Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    {getTypeBadge(q.type)}
                    {getDifficultyBadge(q.difficulty)}
                    {getScopeBadge(q.scope)}
                    {q.status === 'draft' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Bản nháp
                      </span>
                    )}
                    {q.status === 'archived' && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Lưu trữ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {q.subjectName && (
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {q.subjectName} {q.gradeLevel ? `(${q.gradeLevel})` : ''}
                      </span>
                    )}
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                      {q.defaultPoints} điểm
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {q.content}
                  </p>
                  {q.topic && (
                    <div className="text-[11px] text-slate-500 mt-1 italic">
                      Chuyên đề: <strong>{q.topic}</strong>
                    </div>
                  )}
                </div>

                {/* Options display for MCQ & True/False */}
                {q.type !== 'essay' && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect =
                        q.type === 'multiple_choice'
                          ? q.correctAnswers?.includes(optIdx)
                          : q.correctAnswer === optIdx;

                      const letter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {letter}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Essay rubric & sample answer */}
                {q.type === 'essay' && (
                  <div className="space-y-2 bg-amber-50/50 border border-amber-200/70 rounded-xl p-3 text-xs">
                    {q.sampleAnswer && (
                      <div>
                        <div className="font-bold text-amber-900 mb-0.5">Bài giải mẫu / Gợi ý đáp án:</div>
                        <p className="text-amber-800 whitespace-pre-wrap">{q.sampleAnswer}</p>
                      </div>
                    )}
                    {q.rubric && (
                      <div className="pt-2 border-t border-amber-200/50">
                        <div className="font-bold text-amber-900 mb-0.5">Tiêu chí đánh giá & thang điểm:</div>
                        <p className="text-amber-800 whitespace-pre-wrap">{q.rubric}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                    <strong className="text-slate-800">Lời giải chi tiết: </strong>
                    {q.explanation}
                  </div>
                )}

                {/* Card Bottom Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Tạo bởi: <strong className="text-slate-700">{q.createdByName}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingQuestion(q)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleClone(q)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Nhân bản vào kho cá nhân"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {canEdit && (
                      <>
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(q)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title={q.status === 'archived' ? 'Mở lại kích hoạt' : 'Lưu trữ'}
                        >
                          <Filter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingQuestion(q)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới vào ngân hàng'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Question Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Loại câu hỏi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'single_choice' as const, label: 'Trắc nghiệm đơn' },
                { type: 'multiple_choice' as const, label: 'Nhiều đáp án' },
                { type: 'true_false' as const, label: 'Đúng / Sai' },
                { type: 'essay' as const, label: 'Tự luận' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setFormType(item.type);
                    if (item.type === 'true_false') {
                      setFormOptions(['Đúng', 'Sai']);
                      setFormCorrectAnswer(0);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    formType === item.type
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung câu hỏi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Nhập đề bài hoặc câu hỏi tại đây..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          {/* Type-specific inputs */}
          {formType === 'single_choice' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Phương án lựa chọn & Chọn đáp án đúng:
              </label>
              {formOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="singleCorrect"
                    checked={formCorrectAnswer === idx}
                    onChange={() => setFormCorrectAnswer(idx)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 w-5">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...formOptions];
                      next[idx] = e.target.value;
                      setFormOptions(next);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  {formOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = formOptions.filter((_, i) => i !== idx);
                        setFormOptions(next);
                        if (formCorrectAnswer >= next.length) setFormCorrectAnswer(0);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {formOptions.length < 6 && (
                <button
                  type="button"
                  onClick={() => setFormOptions([...formOptions, ''])}
                  className="text-xs text-indigo-600 font-bold hover:underline pt-1"
                >
                  + Thêm phương án lựa chọn
                </button>
              )}
            </div>
          )}

          {formType === 'multiple_choice' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Phương án lựa chọn (Đánh dấu các đáp án đúng):
              </label>
              {formOptions.map((opt, idx) => {
                const checked = formCorrectAnswers.includes(idx);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setFormCorrectAnswers(formCorrectAnswers.filter((i) => i !== idx));
                        } else {
                          setFormCorrectAnswers([...formCorrectAnswers, idx]);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500 w-5">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...formOptions];
                        next[idx] = e.target.value;
                        setFormOptions(next);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    {formOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = formOptions.filter((_, i) => i !== idx);
                          setFormOptions(next);
                          setFormCorrectAnswers(
                            formCorrectAnswers.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i))
                          );
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {formOptions.length < 6 && (
                <button
                  type="button"
                  onClick={() => setFormOptions([...formOptions, ''])}
                  className="text-xs text-indigo-600 font-bold hover:underline pt-1"
                >
                  + Thêm phương án lựa chọn
                </button>
              )}
            </div>
          )}

          {formType === 'true_false' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Chọn đáp án đúng:</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="radio"
                    name="tfChoice"
                    checked={formCorrectAnswer === 0}
                    onChange={() => setFormCorrectAnswer(0)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  Đúng
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="radio"
                    name="tfChoice"
                    checked={formCorrectAnswer === 1}
                    onChange={() => setFormCorrectAnswer(1)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  Sai
                </label>
              </div>
            </div>
          )}

          {formType === 'essay' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bài giải mẫu / Gợi ý làm bài
                </label>
                <textarea
                  rows={3}
                  placeholder="Nội dung bài giải chuẩn để đối chiếu khi chấm..."
                  value={formSampleAnswer}
                  onChange={(e) => setFormSampleAnswer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu chí chấm điểm & thang điểm (Rubric)
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: - Trình bày giả thiết: 0.5đ, - Tính đúng nghiệm: 1.0đ..."
                  value={formRubric}
                  onChange={(e) => setFormRubric(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lời giải thích chi tiết
            </label>
            <textarea
              rows={2}
              placeholder="Giải thích phương pháp giải, công thức sử dụng..."
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Môn học</label>
              <select
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={formGradeLevel}
                onChange={(e) => setFormGradeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
                <option value="Đại học">Đại học</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên đề</label>
              <input
                type="text"
                placeholder="VD: Khảo sát hàm số"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Difficulty & Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Độ khó</label>
              <select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Điểm mặc định</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={formDefaultPoints}
                onChange={(e) => setFormDefaultPoints(parseFloat(e.target.value) || 1.0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phạm vi chia sẻ</label>
              <select
                value={formScope}
                onChange={(e) => setFormScope(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="personal">🔒 Riêng tư cá nhân</option>
                <option value="school_shared">🏫 Chia sẻ trong trường</option>
                <option value="global_shared">🌐 Toàn hệ thống</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              {editingQuestion ? 'Lưu thay đổi' : 'Thêm vào ngân hàng'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập hàng loạt câu hỏi từ file CSV / JSON"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            Dán dữ liệu định dạng CSV hoặc JSON vào khung bên dưới. Hệ thống sẽ kiểm tra cú pháp và tính hợp lệ của từng dòng trước khi lưu.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gán môn học mặc định</label>
              <select
                value={importSubjectId}
                onChange={(e) => setImportSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Không chỉ định --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phạm vi lưu</label>
              <select
                value={importScope}
                onChange={(e) => setImportScope(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="personal">Kho cá nhân</option>
                <option value="school_shared">Chia sẻ trong trường</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Dữ liệu CSV / JSON:</label>
              <button
                type="button"
                onClick={() => setImportText(sampleCSVTemplate)}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Chèn mẫu CSV chuẩn
              </button>
            </div>
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Dán nội dung CSV hoặc JSON..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleParseImport}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
            >
              Kiểm tra tính hợp lệ (Preview)
            </button>
          </div>

          {/* Validation Result Table */}
          {importResult && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  Tổng dòng: <strong>{importResult.total}</strong> | Hợp lệ:{' '}
                  <strong className="text-emerald-600">{importResult.validCount}</strong> | Lỗi:{' '}
                  <strong className="text-rose-600">{importResult.errorCount}</strong>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-800">
                  <div className="font-bold">Chi tiết lỗi các dòng:</div>
                  <ul className="list-disc list-inside space-y-0.5 max-h-28 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>
                        Dòng {err.row}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.validCount > 0 && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận nhập {importResult.validCount} câu hỏi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(viewingQuestion)}
        onClose={() => setViewingQuestion(null)}
        title="Chi tiết câu hỏi trong ngân hàng"
      >
        {viewingQuestion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {getTypeBadge(viewingQuestion.type)}
                {getDifficultyBadge(viewingQuestion.difficulty)}
                {getScopeBadge(viewingQuestion.scope)}
              </div>
              <span className="text-xs font-bold text-slate-700">{viewingQuestion.defaultPoints} điểm</span>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                {viewingQuestion.content}
              </p>
            </div>

            {viewingQuestion.type !== 'essay' && viewingQuestion.options && (
              <div className="space-y-1.5">
                {viewingQuestion.options.map((opt, idx) => {
                  const isCorrect =
                    viewingQuestion.type === 'multiple_choice'
                      ? viewingQuestion.correctAnswers?.includes(idx)
                      : viewingQuestion.correctAnswer === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </span>
                      {isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
            )}

            {viewingQuestion.sampleAnswer && (
              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
                <strong>Đáp án mẫu: </strong>
                <p className="mt-1 whitespace-pre-wrap">{viewingQuestion.sampleAnswer}</p>
              </div>
            )}

            {viewingQuestion.explanation && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
                <strong>Lời giải thích: </strong>
                <p className="mt-1 whitespace-pre-wrap">{viewingQuestion.explanation}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingQuestion)}
        onClose={() => setDeletingQuestion(null)}
        title="Xác nhận xóa câu hỏi"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng câu hỏi? Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingQuestion(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
