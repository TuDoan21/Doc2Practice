import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Cpu,
  CheckCircle,
  BarChart3,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-blue-200/40 blur-3xl rounded-full pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs sm:text-sm font-semibold tracking-wide shadow-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Slogan: “Từ tài liệu đến thành thạo.”</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Biến tài liệu thành bài{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
              luyện tập của riêng bạn
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            Không còn đọc tài liệu thụ động. Tải lên giáo trình PDF, tài liệu Word (.docx) hoặc slide thuyết trình PowerPoint (.pptx) — hệ thống AI sẽ tự động trích xuất các ý chính, tạo câu hỏi trắc nghiệm kèm giải thích chuẩn xác và thẻ ghi nhớ flashcard giúp bạn ôn thi hiệu quả gấp 3 lần.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/app/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Bắt đầu học ngay</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-200 shadow-sm transition-colors"
            >
              <span>Khám phá tính năng</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-200/60 max-w-lg mx-auto text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">30s</div>
              <div className="text-xs text-slate-500 font-medium">Tạo đề thi tự động</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium">Có lời giải chi tiết</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">3x</div>
              <div className="text-xs text-slate-500 font-medium">Tốc độ ghi nhớ</div>
            </div>
          </div>
        </div>

        {/* Interactive App Preview Mockup */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden p-2 sm:p-4 bg-gradient-to-b from-white to-slate-50/50">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-semibold text-slate-400 ml-2">Doc2Practice Simulation Studio</span>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
                Xem trước giao diện luyện thi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tài liệu đầu vào</div>
                <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">Giao_trinh_React_TypeScript.pdf</span>
                </div>
                <p className="text-xs text-slate-500">42 trang • Phân tích hoàn tất</p>
              </div>

              <div className="md:col-span-2 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800">Câu hỏi 1 / 5</span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Mức độ: Trung bình</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Hook nào sau đây trong React được sử dụng để tối ưu hiệu năng bằng cách ghi nhớ giá trị tính toán?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">A. useCallback</div>
                  <div className="p-2.5 rounded-lg bg-indigo-600 text-white font-bold border border-indigo-600 flex items-center justify-between">
                    <span>B. useMemo</span>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">C. useRef</div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">D. useReducer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section: Tải tài liệu -> Tạo câu hỏi -> Luyện tập -> Theo dõi */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Quy trình 4 bước đơn giản</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Từ tài liệu PDF đến nắm vững bài học
          </h2>
          <p className="text-slate-600">
            Biến nguồn tài liệu học thuật khô khan thành trải nghiệm ôn luyện chủ động trong vài tích tắc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Bước 1</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tải tài liệu đa định dạng</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Kéo thả tài liệu PDF, văn bản Word (.docx) hoặc slide thuyết trình PowerPoint (.pptx) của bạn vào hệ thống.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Bước 2</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tạo bộ câu hỏi</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Chọn số lượng câu (5, 10, 20) và độ khó (Dễ, Trung bình, Khó). AI sẽ tự phân tích ý chính và sinh câu hỏi 4 phương án.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Bước 3</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Luyện tập & Thi thử</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Làm bài kiểm tra tương tác, nhận kết quả tức thì, xem lời giải thích chi tiết và lọc riêng các câu làm sai để củng cố.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Bước 4</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Theo dõi tiến độ</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Biểu đồ trực quan ghi lại điểm trung bình, chuỗi ngày học liên tục và các chủ đề cần ôn tập thêm trước kỳ thi.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-50/80 py-16 rounded-3xl border border-slate-200/60">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Được thiết kế cho người tự học</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Tính năng tối ưu cho việc ghi nhớ sâu
          </h2>
          <p className="text-slate-600">
            Không màu mè, tập trung chính xác vào phương pháp học chủ động (Active Recall) và lặp ngắt quãng (Spaced Repetition).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Trắc nghiệm phân loại thông minh</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Câu hỏi bao phủ các ý cốt lõi, từ định nghĩa cơ bản đến tình huống vận dụng. Các phương án nhiễu sát thực tế giúp kiểm tra tư duy thực sự.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Flashcard lật thẻ 3D</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Tự động tạo thẻ từ vựng, thuật ngữ và công thức. Đánh dấu "Đã nhớ" hoặc "Chưa nhớ" để tập trung ôn lại những khái niệm bạn còn mơ hồ.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Giải thích chi tiết từng đáp án</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Mỗi câu hỏi đều chỉ rõ tại sao đáp án A đúng và tại sao các phương án khác chưa chính xác, giúp bạn học được từ chính những câu làm sai.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-8 sm:p-12 text-center text-white shadow-xl overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Sẵn sàng làm chủ tài liệu học tập của bạn?
            </h2>
            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
              Trải nghiệm ngay bản MVP của Doc2Practice với các bộ đề mẫu có sẵn hoặc tải tài liệu của riêng bạn để tạo đề thi thử.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/app/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-base shadow-lg transition-transform hover:scale-105"
              >
                Vào Bảng điều khiển
              </Link>
              <Link
                to="/app/create-quiz"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-800/60 hover:bg-indigo-800 border border-indigo-400/40 text-white font-semibold text-base transition-colors"
              >
                Tạo bài thi thử từ PDF
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

