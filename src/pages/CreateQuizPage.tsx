import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  FileCheck,
  X,
  ArrowRight,
  Info
} from 'lucide-react';
import type { DifficultyLevel } from '../types';
import { simulateAIGeneration } from '../services/storage';

export const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    raw?: File;
  } | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generation status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [completedQuizId, setCompletedQuizId] = useState<string | null>(null);

  const stepsList = [
    'Đang tải lên và phân tích cấu trúc tài liệu (PDF, Word, PowerPoint)...',
    'Trích xuất văn bản, tiêu đề và các khái niệm then chốt...',
    'AI phân tích ngữ cảnh và thiết kế 4 phương án trắc nghiệm...',
    'Hoàn tất bộ câu hỏi trắc nghiệm và lời giải thích!'
  ];

  // Kiểm tra nếu có tài liệu truyền từ Dashboard qua query params
  useEffect(() => {
    const docParam = searchParams.get('doc');
    const sizeParam = searchParams.get('size');
    if (docParam) {
      setSelectedFile({
        name: docParam,
        size: sizeParam || '3.2 MB'
      });
    }
  }, [searchParams]);

  // Handle file drop & select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt'];

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
    setSelectedFile({
      name: file.name,
      size: sizeFormatted,
      raw: file
    });
  };

  // Trả về badge định dạng file
  const getFileTypeBadge = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          PDF
        </span>
      );
    }
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Word (.docx)
        </span>
      );
    }
    if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          PowerPoint (.pptx)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        DOC
      </span>
    );
  };

  // Chọn file mẫu có sẵn
  const selectSampleFile = (name: string, size: string) => {
    setErrorMsg(null);
    setSelectedFile({ name, size });
  };

  // Kích hoạt mô phỏng tạo câu hỏi
  const handleGenerate = () => {
    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn hoặc kéo thả một tệp tài liệu (PDF, Word hoặc PowerPoint) để bắt đầu.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setGenerationStep(0);

    // Mô phỏng chuỗi tiến trình AI từng bước
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < stepsList.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          // Sinh dữ liệu và lưu vào localStorage
          const newQuiz = simulateAIGeneration(
            selectedFile.name,
            selectedFile.size,
            questionCount,
            difficulty
          );
          setCompletedQuizId(newQuiz.id);
          setIsGenerating(false);
          return prev;
        }
      });
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Tạo bộ câu hỏi mới từ tài liệu
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hỗ trợ tải lên tệp PDF, tài liệu Word (.docx) hoặc bài thuyết trình PowerPoint (.pptx) để tự động sinh câu hỏi kiểm tra kiến thức.
        </p>
      </div>

      {/* Demo Notification Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-indigo-900 leading-relaxed">
          <span className="font-bold">Chế độ Demo mô phỏng AI:</span> Hệ thống hỗ trợ nhận diện và xử lý đa định dạng <b>PDF, Word (.docx), PowerPoint (.pptx)</b>. Bộ câu hỏi được tạo sẽ lưu trực tiếp vào trình duyệt và có thể làm bài thi ngay lập tức!
        </div>
      </div>

      {/* Main Generation Flow */}
      {!isGenerating && !completedQuizId && (
        <div className="space-y-8">
          {/* Section 1: File Upload Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>1. Tải lên tài liệu học tập</span>
            </h2>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
                accept=".pdf,.docx,.doc,.pptx,.ppt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <FileCheck className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 text-base">{selectedFile.name}</h4>
                    {getFileTypeBadge(selectedFile.name)}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Dung lượng: {selectedFile.size} • Trạng thái: Sẵn sàng phân tích</p>
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
                    Định dạng hỗ trợ: <span className="font-semibold text-slate-600">.pdf, .docx, .pptx</span> (Tối đa 30MB)
                  </p>
                  <span className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                    Chọn tệp từ thiết bị
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick sample files (PDF, DOCX, PPTX) */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-500 mr-2">Hoặc thử nhanh với các tài liệu mẫu:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => selectSampleFile('Kien_truc_Vi_dieu_khien_ARM.pdf', '4.2 MB')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>PDF: Vi điều khiển ARM.pdf</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectSampleFile('De_cuong_Tri_tue_Nhan_tao_2026.docx', '1.8 MB')}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium transition-colors flex items-center gap-1.5 border border-blue-200"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Word: Đề cương AI.docx</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectSampleFile('Slide_Kien_truc_Mang_May_tinh.pptx', '6.5 MB')}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium transition-colors flex items-center gap-1.5 border border-amber-200"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>PowerPoint: Slide Mạng máy tính.pptx</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Generation Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>2. Cấu hình bài luyện tập</span>
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
                <p className="text-[11px] text-slate-400">Khuyên dùng 5 câu cho bài kiểm tra nhanh.</p>
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
                <p className="text-[11px] text-slate-400">Điều chỉnh độ sâu của các bẫy câu hỏi.</p>
              </div>

              {/* Setting 3: Dạng câu hỏi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Dạng câu hỏi
                </label>
                <div className="w-full py-2.5 px-3 rounded-xl text-xs font-bold border border-indigo-600 bg-indigo-50 text-indigo-700 flex items-center justify-between">
                  <span>Trắc nghiệm 4 đáp án</span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-400">Hỗ trợ tự động tạo kèm Flashcard ghi nhớ.</p>
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
              <span>Tạo bộ câu hỏi</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading & AI Processing Simulation State */}
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
              AI đang phân tích tài liệu của bạn
            </h3>
            <p className="text-sm text-indigo-600 font-semibold min-h-[24px]">
              {stepsList[generationStep]}
            </p>
          </div>

          {/* Progress step indicators */}
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
              Tạo bộ câu hỏi thành công!
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Bộ câu hỏi đã được tạo và lưu trữ trên hệ thống. Bạn có thể bắt đầu làm bài kiểm tra hoặc xem lại danh sách câu hỏi bất kỳ lúc nào.
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
              onClick={() => navigate('/app/quiz-sets')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Xem danh sách bộ đề
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
