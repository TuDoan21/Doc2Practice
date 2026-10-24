import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Cpu,
  CheckCircle,
  BarChart3,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  School,
  Users,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-blue-200/40 blur-3xl rounded-full pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs sm:text-sm font-semibold tracking-wide shadow-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Nền tảng Giáo dục Số: “Từ tài liệu đến thành thạo.”</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Nền tảng hỗ trợ dạy học &{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
              kiểm tra trực tuyến cho trường học
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-3xl mx-auto">
            Doc2Practice giúp nhà trường số hóa toàn diện quy trình kiểm tra đánh giá: thầy cô chuyển đổi tài liệu giáo trình thành đề kiểm tra trong 30 giây bằng AI, tổ chức thi trực tuyến có giám sát chống chuyển tab, tự động chấm điểm và báo cáo phổ điểm toàn diện.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Vào Cổng Trường Học</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-200 shadow-sm transition-colors"
            >
              <span>Đăng ký Tài khoản</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200/60 max-w-2xl mx-auto text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">30s</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">AI sinh đề trắc nghiệm</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Chống gian lận thoát tab</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">80%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Tiết kiệm thời gian chấm thi</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">0đ</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Chi phí in ấn đề thi giấy</div>
            </div>
          </div>
        </div>

        {/* Interactive App Preview Mockup */}
        <div className="mt-14 max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden p-2 sm:p-4 bg-gradient-to-b from-white to-slate-50/50">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-bold text-slate-500 ml-2">Doc2Practice School Portal • THPT Chuyên Lê Hồng Phong</span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chế độ Phòng Thi Có Giám Sát</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tài liệu môn học</div>
                <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">De_cuong_Giai_tich_12_K1.pdf</span>
                </div>
                <div className="text-xs text-slate-500">Giáo viên: ThS. Trần Thị Giáo Viên</div>
                <div className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded w-fit">
                  Lớp 12A1 • 38 học sinh
                </div>
              </div>

              <div className="md:col-span-2 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">Bài kiểm tra 15 phút: Khảo sát Hàm số (Câu 1 / 5)</span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    <span>Khóa thoát tab: BẬT</span>
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Cho hàm số y = f(x) có đạo hàm f'(x) = x(x - 2)^2. Điểm cực tiểu của hàm số đã cho là:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-indigo-600 text-white font-bold border border-indigo-600 flex items-center justify-between shadow-xs">
                    <span>A. x = 0</span>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700">B. x = 2</div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700">C. x = -2</div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700">D. x = 1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars of Benefits Section: School, Teacher, Student */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Giá trị thực tiễn cho trường học</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Giải pháp toàn diện cho 3 đối tượng học đường
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Được thiết kế bám sát thực tế giảng dạy và thi cử tại các trường phổ thông và đại học Việt Nam.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pillar 1: School Admin */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <School className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase">
                Dành cho Ban Giám Hiệu
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 pt-1">Nhà trường & Quản trị</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Số hóa 100% công tác khảo thí và kiểm tra đánh giá định kỳ.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tiết kiệm hàng trăm triệu đồng chi phí in ấn đề thi và giấy thi mỗi năm.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Báo cáo phổ điểm toàn trường, so sánh chất lượng giữa các khối lớp.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Quản lý danh sách giáo viên, duyệt hồ sơ sư phạm và phân quyền chặt chẽ.</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Teacher */}
          <div className="p-8 rounded-3xl bg-white border border-indigo-200/90 shadow-md ring-1 ring-indigo-500/10 hover:shadow-lg transition-all space-y-5 relative">
            <div className="absolute top-5 right-5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Tiết kiệm thời gian nhất
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                Dành cho Thầy Cô & Bộ Môn
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 pt-1">Thầy Cô & Tổ Chuyên Môn</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tải tệp PDF/Word giáo trình lên, AI tự trích xuất và sinh đề thi trong 30 giây.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Chế độ thi khóa chuyển tab: phát hiện học sinh tra cứu Google/mở tab khác.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Phòng giám sát thi trực tiếp: theo dõi thí sinh đang làm bài và nhận cảnh báo gian lận tức thì.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tự động chấm trắc nghiệm và xuất bảng điểm danh sách học sinh ra Excel 1-click.</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Student */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                Dành cho Học Sinh & Phụ Huynh
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 pt-1">Học Sinh & Sinh Viên</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tham gia lớp học bằng mã PIN đơn giản, nhận đề thi và bài tập từ thầy cô.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Thi thử tính giờ với đồng hồ đếm ngược chuẩn kỳ thi thật.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Xem giải thích chi tiết cho từng phương án để hiểu sâu bản chất kiến thức.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tự động gom câu sai vào "Ngân hàng lỗi sai" để luyện lại trước ngày thi chính thức.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4-Step School Workflow */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Quy trình 4 bước đơn giản</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Từ tài liệu bài giảng đến đánh giá chuẩn xác
          </h2>
          <p className="text-slate-600 text-sm">
            Quy trình chuẩn mực giúp số hóa thi cử tại mọi trường phổ thông và đại học.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Bước 1</div>
            <h3 className="text-base font-bold text-slate-900">Tải tài liệu môn học</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thầy cô tải file PDF, Word hoặc PowerPoint bài giảng môn học vào kho tài liệu lớp.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Bước 2</div>
            <h3 className="text-base font-bold text-slate-900">AI trích xuất & Soạn đề</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI phân tích kiến thức, sinh câu hỏi trắc nghiệm theo 3 mức độ và tạo lời giải chi tiết.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Bước 3</div>
            <h3 className="text-base font-bold text-slate-900">Thi trực tuyến chống gian lận</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Học sinh làm bài có đếm giờ. Nếu chuyển tab, hệ thống lập tức cảnh báo và thông báo giáo viên.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Bước 4</div>
            <h3 className="text-base font-bold text-slate-900">Chấm điểm & Báo cáo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chấm điểm tự động, tổng hợp bảng điểm lớp học và xuất báo cáo điểm số ra file Excel chuẩn.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-800 via-indigo-700 to-violet-800 p-8 sm:p-12 text-center text-white shadow-xl overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sẵn sàng đưa Doc2Practice vào trường học của bạn?
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              Trải nghiệm ngay bản dùng thử với tài khoản mẫu cho cả Học sinh, Giáo viên và Quản trị trường học.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-extrabold text-sm shadow-lg transition-transform hover:scale-105"
              >
                Đăng nhập Cổng Trường Học
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-400/40 text-white font-bold text-sm transition-colors"
              >
                Đăng ký tài khoản mới
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

