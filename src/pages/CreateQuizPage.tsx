import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  UploadCloud,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  FileCheck,
  X,
  ArrowRight,
  Type,
  KeyRound,
  Layers
} from 'lucide-react';
import type { DifficultyLevel } from '../types';
import { createQuizAndFlashcards } from '../services/storage';
import { getStoredApiKey, sanitizeAcademicTopic } from '../services/aiService';

export const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab mode: 'file' | 'text'
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');

  // Input states
  const [customTitle, setCustomTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    content?: string;
  } | null>(null);

  // Options
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Key state
  const [hasApiKey, setHasApiKey] = useState(false);

  // Progress states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [completedQuizId, setCompletedQuizId] = useState<string | null>(null);

  const stepsList = [
    'Đang phân tích cấu trúc tài liệu học tập...',
    'Trích xuất các luận điểm và thuật ngữ then chốt...',
    hasApiKey ? 'Google Gemini 1.5 Flash đang thiết kế câu hỏi và giải thích...' : 'AI Engine đang sinh bộ câu hỏi trắc nghiệm và Flashcards...',
    'Hoàn tất bài luyện tập! Đang lưu vào hệ thống...'
  ];

  useEffect(() => {
    setHasApiKey(Boolean(getStoredApiKey()));
  }, []);

  // Nhận tài liệu từ query params nếu có
  useEffect(() => {
    const docParam = searchParams.get('doc');
    const sizeParam = searchParams.get('size');
    if (docParam) {
      setSelectedFile({
        name: docParam,
        size: sizeParam || '3.2 MB',
      });
      setCustomTitle(sanitizeAcademicTopic(docParam));
    }
  }, [searchParams]);

  // Handle file select
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.md'];

  const validateAndSetFile = (file?: File) => {
    setErrorMsg(null);
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some(ext => lowerName.endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg('Vui lòng chỉ tải lên tệp định dạng PDF (.pdf), Word (.docx, .doc), hoặc PowerPoint (.pptx, .ppt).');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setErrorMsg('Dung lượng tệp vượt quá giới hạn cho phép (tối đa 30MB).');
      return;
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    // Đọc text nếu là file text/markdown
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setSelectedFile({
          name: file.name,
          size: sizeFormatted,
          content: text,
        });
      };
      reader.readAsText(file);
    } else {
      setSelectedFile({
        name: file.name,
        size: sizeFormatted,
      });
    }

    if (!customTitle) {
      setCustomTitle(sanitizeAcademicTopic(file.name));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  // Chọn file mẫu có sẵn
  const selectSampleFile = (name: string, size: string, sampleContent?: string) => {
    setErrorMsg(null);
    setSelectedFile({ name, size, content: sampleContent });
    setCustomTitle(sanitizeAcademicTopic(name));
  };

  // Kích hoạt sinh câu hỏi
  const handleGenerate = async () => {
    setErrorMsg(null);

    if (activeTab === 'file' && !selectedFile) {
      setErrorMsg('Vui lòng chọn hoặc kéo thả một tệp tài liệu để tiếp tục.');
      return;
    }

    if (activeTab === 'text' && pastedText.trim().length < 50) {
      setErrorMsg('Nội dung văn bản quá ngắn. Vui lòng dán ít nhất 50 ký tự nội dung bài học.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < stepsList.length - 2 ? prev + 1 : prev));
    }, 700);

    try {
      const rawTitle = customTitle.trim() || (selectedFile ? selectedFile.name : 'Chuyên đề học tập');
      const finalTitle = sanitizeAcademicTopic(rawTitle);
      const textToAnalyze = activeTab === 'text'
        ? pastedText
        : (selectedFile?.content || finalTitle);

      const newQuiz = await createQuizAndFlashcards({
        title: finalTitle,
        sourceType: activeTab,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        textContent: textToAnalyze,
        questionCount,
        difficulty,
      });

      clearInterval(stepInterval);
      setGenerationStep(stepsList.length - 1);
      setTimeout(() => {
        setCompletedQuizId(newQuiz.id);
        setIsGenerating(false);
      }, 500);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      setErrorMsg(`Có lỗi xảy ra: ${err.message || 'Không thể sinh câu hỏi. Vui lòng thử lại.'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tạo bộ câu hỏi mới từ tài liệu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Biến bài giảng, slide hoặc ghi chú của bạn thành đề trắc nghiệm và flashcard chỉ trong vài giây.
          </p>
        </div>

        {/* AI Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasApiKey ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Google Gemini 1.5 Flash</span>
            </div>
          ) : (
            <Link
              to="/app/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Thêm Gemini Key (Tùy chọn)</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Creation Flow */}
      {!isGenerating && !completedQuizId && (
        <div className="space-y-6">
          {/* Method Selection Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl max-w-md">
            <button
              type="button"
              onClick={() => {
                setActiveTab('file');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'file'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải lên tệp tài liệu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('text');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Dán văn bản / Ghi chú</span>
            </button>
          </div>

          {/* Section 1: Input source */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            {/* Title override */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Tiêu đề bộ bài tập / Chủ đề ôn tập
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="VD: Ôn tập Chương 3 - Kiến trúc vi xử lý và bộ nhớ"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            {/* TAB 1: FILE UPLOAD */}
            {activeTab === 'file' ? (
              <div className="space-y-4 pt-2">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    validateAndSetFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                        <FileCheck className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-base mb-1">{selectedFile.name}</h4>
                      <p className="text-xs text-slate-500 mb-4">Dung lượng: {selectedFile.size} • Sẵn sàng phân tích</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hủy chọn tệp</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-base mb-1">
                        Kéo và thả tệp PDF, Word hoặc PowerPoint vào đây
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mb-3">
                        Hỗ trợ .pdf, .docx, .pptx, .txt (Dung lượng tối đa 30MB)
                      </p>
                      <span className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                        Chọn tệp từ máy tính
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick sample files */}
                <div className="pt-2">
                  <span className="text-xs font-medium text-slate-500 mr-2">Hoặc thử nhanh với tài liệu mẫu:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => selectSampleFile(
                        'Kien_truc_Vi_dieu_khien_ARM.pdf',
                        '4.2 MB',
                        'Kiến trúc vi điều khiển ARM Cortex-M: Cấu trúc đường ống lệnh Pipeline 3 giai đoạn Fetch, Decode, Execute. Chế độ hoạt động Thread mode và Handler mode. Bộ điều khiển ngắt NVIC (Nested Vectored Interrupt Controller) hỗ trợ ưu tiên ngắt động và độ trễ thấp. Tập thanh ghi đa dụng R0-R12, con trỏ ngăn xếp SP, thanh ghi liên kết LR và bộ đếm chương trình PC. Cơ chế tiết kiệm năng lượng Sleep và Deep Sleep.'
                      )}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                    >
                      📄 Vi điều khiển ARM.pdf
                    </button>
                    <button
                      type="button"
                      onClick={() => selectSampleFile(
                        'De_cuong_Tri_tue_Nhan_tao_2026.docx',
                        '1.8 MB',
                        'Trí tuệ Nhân tạo và Học máy: Phân biệt học có giám sát Supervised Learning và học không giám sát Unsupervised Learning. Thuật toán tối ưu Gradient Descent và hàm mất mát Loss Function. Hiện tượng Overfitting và kỹ thuật Regularization L1 Lasso và L2 Ridge. Mạng nơ-ron sâu Feedforward và thuật toán lan truyền ngược Backpropagation.'
                      )}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200"
                    >
                      📝 Đề cương AI.docx
                    </button>
                    <button
                      type="button"
                      onClick={() => selectSampleFile(
                        'Slide_Kien_truc_Mang_May_tinh.pptx',
                        '6.5 MB',
                        'Mạng máy tính và truyền thông dữ liệu: Mô hình tham chiếu OSI 7 tầng và bộ giao thức TCP/IP. Cơ chế bắt tay 3 bước Three-way Handshake của giao thức TCP. So sánh TCP truyền tin cậy kiểm soát luồng và UDP phi kết nối tốc độ cao độ trễ thấp. Giao thức định tuyến IP, kỹ thuật chia mạng con CIDR và bảo mật với mã hóa TLS/SSL.'
                      )}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200"
                    >
                      📊 Slide Mạng máy tính.pptx
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: TEXT PASTE */
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Dán nội dung bài học, tóm tắt hoặc slide bài giảng của bạn vào đây:</span>
                  <span>{pastedText.length} ký tự</span>
                </div>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Ví dụ: Dán đoạn giáo trình, các định nghĩa hoặc nội dung slide cần ôn tập..."
                  className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-normal resize-y"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Gợi ý nội dung nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText(`Nguyên lý hoạt động của Hệ điều hành (Operating System):
Hệ điều hành đóng vai trò là cầu nối trung gian giữa phần cứng máy tính và người sử dụng. Bốn nhiệm vụ cốt lõi bao gồm:
1. Quản lý tiến trình (Process Management): Lập lịch CPU, xử lý đa nhiệm, đồng bộ hóa và ngăn ngừa hiện tượng Deadlock.
2. Quản lý bộ nhớ (Memory Management): Cơ chế phân trang (Paging), bộ nhớ ảo (Virtual Memory) và phân đoạn (Segmentation) giúp tăng không gian nhớ hiệu dụng.
3. Quản lý hệ thống tập tin (File System): Tổ chức lưu trữ dạng phân cấp cây thư mục, đảm bảo tính toàn vẹn và phân quyền truy cập.
4. Quản lý thiết bị ngoại vi (I/O System): Cung cấp trình điều khiển thiết bị (Device Drivers) chuẩn hóa giao tiếp phần cứng.`);
                      if (!customTitle) setCustomTitle('Nguyên lý Hệ điều hành & Quản lý bộ nhớ');
                    }}
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    Dán mẫu: Bài học Nguyên lý Hệ điều hành
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Section 2: Generation Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Cấu hình bài luyện tập</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Setting 1: Số lượng câu hỏi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Số lượng câu hỏi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        questionCount === num
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">Khuyên dùng 5 - 10 câu cho bài kiểm tra nhanh.</p>
              </div>

              {/* Setting 2: Độ khó */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mức độ khó
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: 'easy', label: 'Dễ' },
                      { key: 'medium', label: 'Vừa' },
                      { key: 'hard', label: 'Khó' },
                    ] as const
                  ).map((diff) => (
                    <button
                      key={diff.key}
                      type="button"
                      onClick={() => setDifficulty(diff.key)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        difficulty === diff.key
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">Điều chỉnh độ sâu và cạm bẫy câu hỏi.</p>
              </div>

              {/* Setting 3: Gói đầu ra */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kết quả tự động sinh
                </label>
                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-950 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Trắc nghiệm 4 đáp án</span>
                  </div>
                  <div className="font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Tự động tạo kèm Flashcards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:scale-102"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bắt đầu tạo câu hỏi</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading & Processing */}
      {isGenerating && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-md text-center max-w-xl mx-auto space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-indigo-600">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Hệ thống đang xử lý và trích xuất câu hỏi
            </h3>
            <p className="text-sm text-indigo-600 font-semibold min-h-[24px]">
              {stepsList[generationStep]}
            </p>
          </div>

          {/* Progress indicators */}
          <div className="space-y-2 pt-4">
            {stepsList.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-xs text-left transition-all ${
                  idx < generationStep
                    ? 'text-emerald-700 bg-emerald-50 font-medium'
                    : idx === generationStep
                    ? 'text-indigo-800 bg-indigo-50 font-bold ring-1 ring-indigo-300'
                    : 'text-slate-400 bg-slate-50'
                }`}
              >
                {idx < generationStep ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : idx === generationStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {completedQuizId && !isGenerating && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-lg text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              Tạo bộ câu hỏi & Flashcards thành công!
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Bộ câu hỏi đã được lưu an toàn. Bạn có thể làm bài kiểm tra tính giờ ngay bây giờ hoặc ôn lại bằng Flashcard.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/app/quiz/${completedQuizId}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:scale-102"
            >
              <span>Làm bài kiểm tra ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/app/flashcards')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-colors"
            >
              Xem thẻ Flashcards
            </button>
            <button
              onClick={() => navigate('/app/quiz-sets')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Kho đề thi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
