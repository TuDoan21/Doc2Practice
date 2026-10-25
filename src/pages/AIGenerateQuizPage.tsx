import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  Edit3,
  Save,
  Check,
  Send,
  Sliders,
  KeyRound,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { getCurrentUser, type UserProfile } from '../services/auth';
import { getMaterials } from '../services/materialService';
import { getClassrooms } from '../services/classService';
import { getSubjects } from '../services/subjectService';
import {
  generateQuestionsFromMaterials,
  saveDraftsToQuestionBank,
  createAssessmentFromDrafts,
  resolveGeminiApiKey,
} from '../services/aiQuestionService';
import { saveStoredApiKey } from '../services/aiService';
import type {
  LearningMaterial,
  Classroom,
  Subject,
  QuestionType,
  DifficultyLevel,
  AIGeneratedQuestionDraft,
} from '../types';
import { Modal } from '../components/common/Modal';

export const AIGenerateQuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());

  // Data sources
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Workflow steps: 1 = Config, 2 = Generating, 3 = Review & Edit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Config States
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<'material' | 'direct_text'>('material');
  const [directText, setDirectText] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'single_choice',
    'multiple_choice',
    'true_false',
    'essay',
  ]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [customPrompt, setCustomPrompt] = useState('');

  // Generation Progress & Result States
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [drafts, setDrafts] = useState<AIGeneratedQuestionDraft[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editing Draft Modal State
  const [editingDraft, setEditingDraft] = useState<AIGeneratedQuestionDraft | null>(null);

  // Create Assessment Modal State
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentClassId, setAssessmentClassId] = useState('');
  const [assessmentDuration, setAssessmentDuration] = useState(45);
  const [assessmentPreventTab, setAssessmentPreventTab] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Gemini API Key dialog
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Load initial data
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!user) {
      navigate('/login');
      return;
    }

    setHasApiKey(Boolean(resolveGeminiApiKey()));

    const matsRes = getMaterials(undefined, user);
    if (matsRes.success) setMaterials(matsRes.data);

    const classes = getClassrooms();
    // Filter classes teacher can manage
    const myClasses = user.role === 'teacher'
      ? classes.filter((c) => c.teacherId === user.id)
      : classes;
    setClassrooms(myClasses);
    if (myClasses.length > 0) setAssessmentClassId(myClasses[0].id);

    const subs = getSubjects();
    setSubjects(subs);

    // Read material query param if opened from Documents page
    const matParam = searchParams.get('materialId');
    if (matParam) {
      setSelectedMaterialIds([matParam]);
      const matched = matsRes.success ? matsRes.data.find((m) => m.id === matParam) : null;
      if (matched) {
        if (matched.topic) setTopicName(matched.topic);
        if (matched.subjectId) setSelectedSubjectId(matched.subjectId);
      }
    }
  }, [navigate, searchParams]);

  // Handle Type toggle
  const toggleQuestionType = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) {
        setErrorMessage('Vui lòng chọn ít nhất một dạng câu hỏi.');
        return;
      }
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Filter materials for picker
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        !materialSearch ||
        m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.originalFileName.toLowerCase().includes(materialSearch.toLowerCase()) ||
        (m.topic && m.topic.toLowerCase().includes(materialSearch.toLowerCase()));
      const matchSubject = !selectedSubjectId || m.subjectId === selectedSubjectId;
      return matchSearch && matchSubject;
    });
  }, [materials, materialSearch, selectedSubjectId]);

  // Handle Start Generation
  const handleStartGeneration = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (inputMode === 'material' && selectedMaterialIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một tài liệu học tập để AI phân tích.');
      return;
    }

    if (inputMode === 'direct_text' && directText.trim().length < 30) {
      setErrorMessage('Nội dung văn bản quá ngắn. Vui lòng nhập tối thiểu 30 ký tự.');
      return;
    }

    if (selectedTypes.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một loại câu hỏi kiểm tra.');
      return;
    }

    setCurrentStep(2);
    setGenerationProgress(15);
    setGenerationStatusText('Đang đọc và giải mã cấu trúc tài liệu học tập...');

    const matchedSubject = subjects.find((s) => s.id === selectedSubjectId);

    const progressTimer = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev < 40) {
          setGenerationStatusText('Trích xuất kiến thức trọng tâm, định lý và nguyên tắc...');
          return prev + 15;
        } else if (prev < 75) {
          setGenerationStatusText('AI đang thiết kế câu hỏi, phương án bẫy và đáp án chi tiết...');
          return prev + 12;
        } else if (prev < 90) {
          setGenerationStatusText('Thẩm định dữ liệu theo chuẩn khảo thí và phân loại độ khó...');
          return prev + 5;
        }
        return prev;
      });
    }, 600);

    try {
      const res = await generateQuestionsFromMaterials(
        {
          materialIds: inputMode === 'material' ? selectedMaterialIds : undefined,
          textContent: inputMode === 'direct_text' ? directText : undefined,
          subjectId: selectedSubjectId || undefined,
          subjectName: matchedSubject?.name,
          topic: topicName || undefined,
          questionCount,
          questionTypes: selectedTypes,
          difficulty,
          customPrompt: customPrompt.trim() || undefined,
        },
        currentUser
      );

      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStatusText('Hoàn tất trích xuất câu hỏi!');

      if (!res.success) {
        setCurrentStep(1);
        setErrorMessage(res.error.message || 'Không thể tạo câu hỏi từ tài liệu.');
        return;
      }

      setDrafts(res.data.drafts);
      setCurrentStep(3);
      setSuccessMessage(`AI đã tạo thành công ${res.data.drafts.length} câu hỏi dự thảo!`);
    } catch (err: any) {
      clearInterval(progressTimer);
      setCurrentStep(1);
      setErrorMessage(`Lỗi trong quá trình sinh câu hỏi: ${err.message || err}`);
    }
  };

  // Draft Actions
  const handleToggleSelectDraft = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isSelected: !d.isSelected } : d))
    );
  };

  const handleSelectAllDrafts = (select: boolean) => {
    setDrafts((prev) => prev.map((d) => ({ ...d, isSelected: select })));
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveDraftEdit = (updated: AIGeneratedQuestionDraft) => {
    setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setEditingDraft(null);
  };

  // Save Confirmed Drafts to Question Bank (Phase 5)
  const handleSaveToQuestionBank = async () => {
    const selectedCount = drafts.filter((d) => d.isSelected !== false).length;
    if (selectedCount === 0) {
      setErrorMessage('Vui lòng tích chọn ít nhất một câu hỏi để lưu.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveDraftsToQuestionBank(drafts, { scope: 'personal' }, currentUser);
      setIsSaving(false);
      if (!res.success) {
        setErrorMessage(res.error.message);
        return;
      }
      setSuccessMessage(res.message || 'Đã lưu thành công các câu hỏi vào Ngân hàng câu hỏi!');
      setTimeout(() => {
        navigate('/app/question-bank');
      }, 1200);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(`Lỗi lưu câu hỏi: ${err.message || err}`);
    }
  };

  // Create Assessment Directly for Class (Phase 6)
  const handleCreateClassAssessment = async (publishImmediately: boolean) => {
    if (!assessmentClassId) {
      setErrorMessage('Vui lòng chọn lớp học để giao bài kiểm tra.');
      return;
    }

    const title = assessmentTitle.trim() || `Bài kiểm tra ${topicName || 'Chuyên đề'} (Tạo bởi AI)`;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await createAssessmentFromDrafts(
        {
          title,
          classId: assessmentClassId,
          drafts,
          durationMinutes: assessmentDuration,
          type: 'exam',
          preventTabSwitch: assessmentPreventTab,
          publishImmediately,
        },
        currentUser
      );

      setIsSaving(false);
      setIsAssessmentModalOpen(false);

      if (!res.success) {
        setErrorMessage(res.error.message);
        return;
      }

      setSuccessMessage(
        publishImmediately
          ? 'Đã tạo và xuất bản bài kiểm tra thành công cho lớp học!'
          : 'Đã tạo bản nháp bài kiểm tra thành công!'
      );

      setTimeout(() => {
        navigate('/app/classes');
      }, 1200);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(`Lỗi tạo bài kiểm tra: ${err.message || err}`);
    }
  };

  // Student Access Denied Guard
  if (currentUser?.role === 'student') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Giới hạn quyền truy cập</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Tính năng AI đọc tài liệu để tự động thiết kế câu hỏi, ngân hàng đề và bài kiểm tra
            được thiết kế dành riêng cho <strong>Giáo viên</strong> và <strong>Ban Giám Hiệu</strong>.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/app/classes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span>Về lớp học của tôi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Đọc Tài Liệu & Thiết Kế Đề Thi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tạo câu hỏi tự động từ bài giảng & tài liệu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tự động trích xuất các dạng câu hỏi trắc nghiệm đơn, nhiều lựa chọn, đúng/sai và tự luận theo chuẩn sư phạm.
          </p>
        </div>

        {/* Gemini API Key Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasApiKey ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Gemini 1.5 Flash</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cấu hình Gemini Key</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Lỗi: </span>
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Thành công: </span>
            {successMessage}
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            currentStep === 1
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
              : currentStep > 1
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs font-bold shrink-0">
            {currentStep > 1 ? '✓' : '1'}
          </span>
          <span className="truncate">1. Chọn tài liệu & Cấu hình</span>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            currentStep === 2
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
              : currentStep > 2
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs font-bold shrink-0">
            {currentStep > 2 ? '✓' : '2'}
          </span>
          <span className="truncate">2. AI trích xuất câu hỏi</span>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            currentStep === 3
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs font-bold shrink-0">
            3
          </span>
          <span className="truncate">3. Duyệt & Lưu vào Ngân hàng</span>
        </div>
      </div>

      {/* ===================== STEP 1: CONFIGURATION ===================== */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Document Selection (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Nguồn tài liệu phân tích</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn một hoặc nhiều tài liệu học tập của trường hoặc dán văn bản trực tiếp.
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInputMode('material')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    inputMode === 'material' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Tài liệu hệ thống
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('direct_text')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    inputMode === 'direct_text' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Dán nội dung
                </button>
              </div>
            </div>

            {inputMode === 'material' ? (
              <div className="space-y-3">
                {/* Search & Subject filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Tìm theo tên bài giảng, tệp..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Tất cả môn học --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Materials List */}
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {filteredMaterials.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Không tìm thấy tài liệu phù hợp.{' '}
                      <Link to="/app/documents" className="text-indigo-600 font-bold hover:underline">
                        Tải thêm tài liệu lên tại đây
                      </Link>
                    </div>
                  ) : (
                    filteredMaterials.map((mat) => {
                      const isSelected = selectedMaterialIds.includes(mat.id);
                      return (
                        <div
                          key={mat.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMaterialIds(selectedMaterialIds.filter((id) => id !== mat.id));
                            } else {
                              setSelectedMaterialIds([...selectedMaterialIds, mat.id]);
                              if (!topicName && mat.topic) setTopicName(mat.topic);
                              if (!selectedSubjectId && mat.subjectId) setSelectedSubjectId(mat.subjectId);
                            }
                          }}
                          className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                            isSelected
                              ? 'bg-indigo-50/80 border border-indigo-300'
                              : 'hover:bg-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlled by parent div
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{mat.title}</p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {mat.originalFileName} • {mat.fileSizeFormatted} • {mat.subjectName || 'Chung'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              mat.fileType === 'pdf'
                                ? 'bg-rose-100 text-rose-700'
                                : mat.fileType === 'docx'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {mat.fileType}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    Đã chọn:{' '}
                    <strong className="text-indigo-600">{selectedMaterialIds.length}</strong> tài liệu
                  </span>
                  {selectedMaterialIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMaterialIds([])}
                      className="text-rose-600 hover:underline"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Dán nội dung giáo trình, bài giảng hoặc ghi chú học tập:
                </label>
                <textarea
                  value={directText}
                  onChange={(e) => setDirectText(e.target.value)}
                  placeholder="Dán nội dung lý thuyết, công thức hoặc các luận điểm chính tại đây..."
                  rows={10}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Đã nhập {directText.length} ký tự. Khuyến khích từ 200 - 5000 từ để AI đạt độ chính xác cao nhất.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Generation Configuration (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Cấu hình sư phạm & AI</span>
            </h2>

            {/* Topic & Subject */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên chuyên đề / Bài kiểm tra:
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="VD: Khảo sát hàm số, Quang hình học..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Question Count Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Số lượng câu hỏi dự thảo:</span>
                  <span className="text-indigo-600 font-extrabold text-sm">{questionCount} câu</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 câu</span>
                  <span>10 câu</span>
                  <span>20 câu</span>
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Các dạng câu hỏi cần sinh:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTypes.includes('single_choice')
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes('single_choice')}
                      onChange={() => toggleQuestionType('single_choice')}
                      className="rounded text-indigo-600"
                    />
                    <span>Trắc nghiệm đơn</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTypes.includes('multiple_choice')
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes('multiple_choice')}
                      onChange={() => toggleQuestionType('multiple_choice')}
                      className="rounded text-indigo-600"
                    />
                    <span>Nhiều đáp án đúng</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTypes.includes('true_false')
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes('true_false')}
                      onChange={() => toggleQuestionType('true_false')}
                      className="rounded text-indigo-600"
                    />
                    <span>Đúng / Sai</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTypes.includes('essay')
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes('essay')}
                      onChange={() => toggleQuestionType('essay')}
                      className="rounded text-indigo-600"
                    />
                    <span>Tự luận & Rubric</span>
                  </label>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mức độ phân hóa:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        difficulty === diff
                          ? diff === 'easy'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                            : diff === 'medium'
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                              : 'bg-rose-50 border-rose-400 text-rose-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {diff === 'easy' ? 'Dễ (Nhận biết)' : diff === 'medium' ? 'Trung bình' : 'Khó (Vận dụng)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yêu cầu sư phạm bổ sung cho AI (tùy chọn):
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="VD: Tập trung vào các bẫy thường gặp trong kỳ thi THPT Quốc gia; các câu tự luận cần chia thang điểm cụ thể..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Launch Button */}
            <button
              type="button"
              onClick={handleStartGeneration}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all transform active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bắt đầu phân tích & Tạo câu hỏi</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== STEP 2: GENERATING ANIMATION ===================== */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin flex items-center justify-center" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">AI đang xử lý tài liệu</h3>
            <p className="text-sm text-slate-500 font-medium">{generationStatusText}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <div className="text-xs font-bold text-indigo-600">{generationProgress}% hoàn tất</div>
          </div>

          <p className="text-xs text-slate-400">
            Hệ thống đang đối soát dữ liệu với các tiêu chuẩn sư phạm và kiểm tra đáp án tự động...
          </p>
        </div>
      )}

      {/* ===================== STEP 3: REVIEW, EDIT & SAVE DRAFTS ===================== */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold">
                  {drafts.length} câu hỏi dự thảo
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600">
                  Đã chọn: <strong>{drafts.filter((d) => d.isSelected !== false).length}</strong> câu
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Giáo viên có thể trực tiếp chỉnh sửa nội dung, đáp án hoặc loại bỏ các câu hỏi trước khi lưu.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thiết lập lại</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveToQuestionBank}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu vào Ngân hàng</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAssessmentModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm shadow-indigo-100 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tạo Đề Kiểm Tra Lớp</span>
              </button>
            </div>
          </div>

          {/* Selection Utilities */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectAllDrafts(true)}
                className="text-indigo-600 font-bold hover:underline"
              >
                Chọn tất cả ({drafts.length})
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleSelectAllDrafts(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                Bỏ chọn tất cả
              </button>
            </div>
            <span>
              Tự động lưu ý: Các câu hỏi được lưu sẽ sẵn sàng dùng để giao bài cho học sinh ngay lập tức.
            </span>
          </div>

          {/* Questions Cards List */}
          <div className="space-y-4">
            {drafts.map((draft, idx) => {
              const isSelected = draft.isSelected !== false;
              return (
                <div
                  key={draft.id}
                  className={`bg-white rounded-2xl border transition-all p-5 space-y-4 ${
                    isSelected
                      ? 'border-slate-200 shadow-sm'
                      : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectDraft(draft.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="font-extrabold text-slate-900 text-sm">Câu {idx + 1}</span>

                      {/* Type Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          draft.type === 'single_choice'
                            ? 'bg-blue-100 text-blue-800'
                            : draft.type === 'multiple_choice'
                              ? 'bg-purple-100 text-purple-800'
                              : draft.type === 'true_false'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {draft.type === 'single_choice'
                          ? 'Trắc nghiệm đơn'
                          : draft.type === 'multiple_choice'
                            ? 'Nhiều đáp án đúng'
                            : draft.type === 'true_false'
                              ? 'Đúng / Sai'
                              : 'Tự luận'}
                      </span>

                      {/* Difficulty */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          draft.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : draft.difficulty === 'medium'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {draft.difficulty === 'easy' ? 'Dễ' : draft.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                      </span>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingDraft(draft)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Chỉnh sửa câu hỏi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-slate-900 text-sm font-medium leading-relaxed pl-7">
                    {draft.content}
                  </div>

                  {/* Options Display for Choice / True-False */}
                  {draft.options && draft.options.length > 0 && (
                    <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {draft.options.map((opt, optIdx) => {
                        const isCorrectSingle = draft.type === 'single_choice' && draft.correctAnswer === optIdx;
                        const isCorrectMulti = draft.type === 'multiple_choice' && draft.correctAnswers?.includes(optIdx);
                        const isCorrectTF = draft.type === 'true_false' && draft.correctAnswer === optIdx;
                        const isCorrect = isCorrectSingle || isCorrectMulti || isCorrectTF;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {draft.type === 'true_false'
                                  ? optIdx === 0 ? 'Đ' : 'S'
                                  : String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isCorrect && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Sample Answer & Rubric Display */}
                  {draft.type === 'essay' && (
                    <div className="pl-7 space-y-2 pt-1 text-xs">
                      {draft.sampleAnswer && (
                        <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
                          <span className="font-bold text-indigo-900 block mb-1">Gợi ý trả lời:</span>
                          <p className="text-slate-700 whitespace-pre-line">{draft.sampleAnswer}</p>
                        </div>
                      )}
                      {draft.rubric && (
                        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                          <span className="font-bold text-amber-900 block mb-1">Tiêu chí chấm điểm (Rubric):</span>
                          <p className="text-slate-700 whitespace-pre-line">{draft.rubric}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation & Source Reference */}
                  <div className="pl-7 space-y-1.5 pt-1 text-xs">
                    {draft.explanation && (
                      <div className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong className="text-slate-800">Lời giải chi tiết: </strong>
                        {draft.explanation}
                      </div>
                    )}
                    {draft.sourceReference && (
                      <div className="text-[11px] text-slate-400 italic">
                        Căn cứ trích dẫn: "{draft.sourceReference}"
                      </div>
                    )}
                    {draft.validationError && (
                      <div className="text-rose-600 font-semibold text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Cảnh báo: {draft.validationError}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT QUESTION DRAFT ===================== */}
      {editingDraft && (
        <Modal
          isOpen={Boolean(editingDraft)}
          onClose={() => setEditingDraft(null)}
          title="Chỉnh sửa câu hỏi dự thảo"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi:</label>
              <textarea
                value={editingDraft.content}
                onChange={(e) => setEditingDraft({ ...editingDraft, content: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Options Editing for Choices */}
            {editingDraft.options && editingDraft.options.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Phương án lựa chọn & Đáp án đúng:
                </label>
                {editingDraft.options.map((opt, optIdx) => {
                  const isChecked =
                    editingDraft.type === 'multiple_choice'
                      ? editingDraft.correctAnswers?.includes(optIdx)
                      : editingDraft.correctAnswer === optIdx;

                  return (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type={editingDraft.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                        name="correct_option"
                        checked={Boolean(isChecked)}
                        onChange={() => {
                          if (editingDraft.type === 'multiple_choice') {
                            const cur = editingDraft.correctAnswers || [];
                            const next = cur.includes(optIdx)
                              ? cur.filter((x) => x !== optIdx)
                              : [...cur, optIdx];
                            setEditingDraft({ ...editingDraft, correctAnswers: next });
                          } else {
                            setEditingDraft({ ...editingDraft, correctAnswer: optIdx });
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-500 w-4 shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(editingDraft.options || [])];
                          newOpts[optIdx] = e.target.value;
                          setEditingDraft({ ...editingDraft, options: newOpts });
                        }}
                        className="flex-1 p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Essay specific */}
            {editingDraft.type === 'essay' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gợi ý đáp án:</label>
                  <textarea
                    value={editingDraft.sampleAnswer || ''}
                    onChange={(e) => setEditingDraft({ ...editingDraft, sampleAnswer: e.target.value })}
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thang điểm chấm (Rubric):</label>
                  <textarea
                    value={editingDraft.rubric || ''}
                    onChange={(e) => setEditingDraft({ ...editingDraft, rubric: e.target.value })}
                    rows={2}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lời giải chi tiết:</label>
              <textarea
                value={editingDraft.explanation || ''}
                onChange={(e) => setEditingDraft({ ...editingDraft, explanation: e.target.value })}
                rows={2}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveDraftEdit(editingDraft)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Cập nhật câu hỏi
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== MODAL: CREATE CLASS ASSESSMENT DIRECTLY ===================== */}
      {isAssessmentModalOpen && (
        <Modal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          title="Tạo đề kiểm tra cho lớp học từ câu hỏi AI"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lớp học tiếp nhận:</label>
              <select
                value={assessmentClassId}
                onChange={(e) => setAssessmentClassId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.subject}) • Mã: {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề đề thi / bài kiểm tra:</label>
              <input
                type="text"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
                placeholder={`Kiểm tra ${topicName || 'Chuyên đề học tập'}`}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian làm bài (Phút):</label>
              <input
                type="number"
                min="5"
                max="180"
                value={assessmentDuration}
                onChange={(e) => setAssessmentDuration(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={assessmentPreventTab}
                onChange={(e) => setAssessmentPreventTab(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Bật khóa chuyển tab chống gian lận (Tab-switch lock)</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleCreateClassAssessment(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Lưu bản nháp
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleCreateClassAssessment(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
              >
                Xuất bản cho học sinh làm bài
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== MODAL: GEMINI API KEY SETUP ===================== */}
      {isApiKeyModalOpen && (
        <Modal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          title="Cấu hình Google Gemini API Key"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhập API Key Google Gemini 1.5 Flash để kích hoạt AI trực tiếp từ Google AI Studio.
              Hệ thống lưu trữ an toàn trong trình duyệt của bạn và không chia sẻ ra ngoài.
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  saveStoredApiKey(apiKeyInput);
                  setHasApiKey(Boolean(apiKeyInput.trim()));
                  setIsApiKeyModalOpen(false);
                  setSuccessMessage('Đã lưu Gemini API Key thành công!');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Lưu khóa API
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
