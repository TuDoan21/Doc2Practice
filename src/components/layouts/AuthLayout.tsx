import { Outlet, Link } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  Layers,
  BarChart3,
  CheckCircle2,
  BrainCircuit,
  ArrowLeft
} from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Cột bên trái: Khu vực Form đăng nhập / đăng ký */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 z-10 bg-white">
        {/* Top Header Logo */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Doc<span className="text-indigo-600">2</span>Practice
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                  MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Học thông minh hơn từ chính tài liệu của bạn</p>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Nội dung Form chính (Login hoặc Register) */}
        <div className="my-auto py-8 sm:py-10 max-w-md w-full mx-auto">
          <Outlet />
        </div>

        {/* Footer nhỏ */}
        <div className="text-center lg:text-left text-xs text-slate-400 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Doc2Practice. Mọi quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <a href="#terms" className="hover:text-indigo-600 transition-colors">Điều khoản</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-indigo-600 transition-colors">Bảo mật</a>
            <span>•</span>
            <a href="#help" className="hover:text-indigo-600 transition-colors">Hỗ trợ</a>
          </div>
        </div>
      </div>

      {/* Cột bên phải: Khu vực Giới thiệu & Minh họa (Ẩn trên màn hình nhỏ) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-12 xl:p-16 flex-col justify-between overflow-hidden">
        {/* Glow hiệu ứng nền */}
        <div className="absolute top-1/4 right-1/4 -z-0 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-10 -z-0 w-72 h-72 bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Header giới thiệu */}
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Learning Assistant</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Biến tài liệu thành <br />
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent">
              lợi thế học tập vượt trội
            </span>
          </h2>
          <p className="text-indigo-200/80 text-sm max-w-lg leading-relaxed">
            Tối ưu hóa thời gian ôn thi của bạn. Chuyển đổi các bài giảng và slide thành trải nghiệm tự kiểm tra và ghi nhớ sâu.
          </p>
        </div>

        {/* 3 Lợi ích chính */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Tạo câu hỏi từ tài liệu bằng AI</h4>
              <p className="text-xs text-indigo-200/70 mt-0.5 leading-relaxed">
                Tự động trích xuất ý chính từ PDF, Word (.docx) và Slide PowerPoint (.pptx) thành đề thi trắc nghiệm kèm giải thích chi tiết.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Ôn tập với Flashcard thông minh</h4>
              <p className="text-xs text-indigo-200/70 mt-0.5 leading-relaxed">
                Phương pháp lặp ngắt quãng (Spaced Repetition) giúp biến thuật ngữ phức tạp thành phản xạ ghi nhớ lâu dài.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Theo dõi tiến độ và kết quả học tập</h4>
              <p className="text-xs text-indigo-200/70 mt-0.5 leading-relaxed">
                Thống kê chuỗi ngày học, điểm trung bình và phát hiện chính xác lỗ hổng kiến thức để bổ sung kịp thời.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Mockup Thẻ bài học thu nhỏ */}
        <div className="relative z-10 p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-800/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-indigo-200 font-semibold">Kết quả thi thử gần nhất</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
              Điểm: 95% (19/20 câu)
            </span>
          </div>
          <div className="pt-2 text-xs text-indigo-200/90 italic flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>“Làm trắc nghiệm từ chính slide bài giảng giúp mình đạt điểm A môn Kiến trúc máy tính!”</span>
          </div>
        </div>
      </div>
    </div>
  );
};

