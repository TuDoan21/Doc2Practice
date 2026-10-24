import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Calendar,
  Zap,
  Users,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  getDocuments,
  getQuizSets,
  getStats,
  getUniqueMistakes,
  createMistakeBankQuizSet
} from '../services/storage';
import { getClassrooms, getAssignments } from '../services/classService';
import { getCurrentUser, type UserProfile } from '../services/auth';
import type { DocumentItem, QuizSet, UserStats, Classroom, ClassAssignment } from '../types';
import { DifficultyBadge } from '../components/common/Badge';
import { weeklyActivityData } from '../data/mockData';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [stats, setStats] = useState<UserStats>(getStats());
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);

  useEffect(() => {
    setStats(getStats());
    setDocuments(getDocuments().slice(0, 3));
    setQuizSets(getQuizSets().slice(0, 3));
    setCurrentUser(getCurrentUser());
    setMistakesCount(getUniqueMistakes().length);
    setClassrooms(getClassrooms());
    setAssignments(getAssignments());

    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    const handleClassChange = () => {
      setClassrooms(getClassrooms());
      setAssignments(getAssignments());
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    window.addEventListener('classes_updated', handleClassChange);
    window.addEventListener('assignments_updated', handleClassChange);

    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
      window.removeEventListener('classes_updated', handleClassChange);
      window.removeEventListener('assignments_updated', handleClassChange);
    };
  }, []);

  const handleStartMistakesFromDashboard = () => {
    const newQuiz = createMistakeBankQuizSet();
    if (newQuiz) {
      navigate(`/app/quiz/${newQuiz.id}`);
    }
  };

  const isTeacher = currentUser.role === 'teacher';
  const relevantClasses = isTeacher
    ? classrooms
    : classrooms.filter((c) => c.studentIds.includes(currentUser.id));
  const examCount = assignments.filter((a) => a.type === 'exam').length;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-lg overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chuỗi học tập: {stats.studyStreakDays} ngày liên tiếp 🔥</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào mừng bạn trở lại, {currentUser.fullName}!
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Hôm nay bạn muốn biến tài liệu nào thành bài luyện tập? Tải lên PDF, Word, PowerPoint hoặc dán ghi chú để kiểm tra ngay mức độ hiểu bài.
            </p>
          </div>

          <Link
            to="/app/create-quiz"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Tạo bộ câu hỏi mới</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Số tài liệu */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tài liệu đã lưu</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalDocuments}</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
              <span>PDF, Word, PPTX</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Số bộ câu hỏi */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bộ câu hỏi</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalQuizSets}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Sẵn sàng luyện thi</div>
          </div>
        </div>

        {/* Stat 3: Số câu đã làm */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số câu đã luyện</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalQuestionsAnswered}</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+15 câu tuần này</span>
            </div>
          </div>
        </div>

        {/* Stat 4: Điểm trung bình */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm trung bình</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.averageScore}%</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Mức độ hiểu bài: Giỏi</div>
          </div>
        </div>
      </div>

      {/* Classroom Quick Access Card for Teacher or Student */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all shadow-sm ${
        isTeacher
          ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 border-indigo-700/60 text-white'
          : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isTeacher
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
              }`}>
                {isTeacher ? <Users className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                <span>{isTeacher ? '👨‍🏫 Khu vực Dành riêng cho Giáo viên' : '🎓 Không gian Học sinh / Sinh viên'}</span>
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 hidden sm:inline">Doc2Practice Classroom</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
              {isTeacher
                ? `Quản lý Lớp học & Giám sát Kỳ thi (${relevantClasses.length} lớp • ${assignments.length} bài tập/thi)`
                : `Lớp học của bạn & Bài kiểm tra được giao (${relevantClasses.length} lớp tham gia)`}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isTeacher
                ? 'Tạo lớp bằng mã PIN, phân phát bài ôn tập & đề thi trắc nghiệm từ tài liệu của bạn, đồng thời theo dõi điểm số và cảnh báo gian lận chuyển tab trực tiếp.'
                : 'Tham gia lớp học của giáo viên bằng mã PIN để làm bài tập, bài kiểm tra có giám sát chống chuyển tab, hoặc tự do tải tài liệu cá nhân để ôn luyện riêng biệt.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-medium border border-white/10 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-300" />
                <span>{relevantClasses.length} Lớp học</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-medium border border-white/10 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>{examCount} Bài thi có giám sát</span>
              </span>
              {!isTeacher && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  ✓ Tự do upload file cá nhân để học riêng
                </span>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col gap-2.5 shrink-0">
            <Link
              to="/app/classes"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-extrabold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <span>{isTeacher ? 'Quản lý Lớp & Xem điểm' : 'Vào Lớp & Xem đề thi'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mistake Bank Callout Banner */}
      {mistakesCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-amber-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Góc khắc phục lỗ hổng: Có {mistakesCount} câu hỏi bạn từng làm sai
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Ôn luyện lại các câu sai là chìa khóa để đạt điểm tối đa trong kỳ thi thật.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartMistakesFromDashboard}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-102 shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Luyện tập ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Progress Chart & Quick Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tiến độ luyện tập 7 ngày qua</h2>
              <p className="text-xs text-slate-500">Số lượng câu trắc nghiệm bạn đã hoàn thành mỗi ngày</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tuần này</span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg space-y-1">
                          <p className="font-bold">Thứ: {data.day}</p>
                          <p className="text-indigo-200">Đã làm: <span className="text-white font-bold">{data.questions} câu</span></p>
                          <p className="text-emerald-300">Điểm TB: <span className="text-white font-bold">{data.avgScore}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="questions" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQuestions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Tips / Advice card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-indigo-950">Bí quyết ôn luyện hiệu quả</h3>
              <p className="text-xs text-indigo-800/80 leading-relaxed mt-1">
                Làm bài trắc nghiệm ngay sau khi đọc tài liệu giúp não bộ củng cố synap thần kinh. Đối với các câu làm sai, hãy dùng thẻ Flashcard để lặp lại sau 24 giờ.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-100/80 text-xs text-slate-700 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ôn lại 5 câu sai gần đây nhất</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-100/80 text-xs text-slate-700 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Luyện Flashcard thuật ngữ React</span>
              </div>
            </div>
          </div>

          <Link
            to="/app/flashcards"
            className="mt-6 inline-flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <span>Đến trang Flashcard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Two columns: Recent Quiz Sets & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quiz Sets */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Bộ câu hỏi gần đây</h2>
            </div>
            <Link
              to="/app/quiz-sets"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {quizSets.map((set) => (
              <div key={set.id} className="py-3.5 flex items-center justify-between gap-4 group">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={set.difficulty} />
                    <span className="text-xs text-slate-400">• {set.questionCount} câu</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {set.title}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>{set.sourceDocumentName}</span>
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {set.lastScore !== undefined && set.lastScore !== null && (
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-emerald-600">{set.lastScore}%</div>
                      <div className="text-[10px] text-slate-400">Điểm gần nhất</div>
                    </div>
                  )}
                  <Link
                    to={`/app/quiz/${set.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    Làm bài
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Tài liệu đã tải lên</h2>
            </div>
            <Link
              to="/app/documents"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{doc.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.pageCount} trang</span>
                      <span>•</span>
                      <span>{doc.uploadedAt}</span>
                    </p>
                  </div>
                </div>

                <Link
                  to={`/app/create-quiz?doc=${encodeURIComponent(doc.name)}&size=${encodeURIComponent(doc.size)}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-xs font-semibold text-slate-600 transition-colors"
                >
                  Tạo đề thi
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

