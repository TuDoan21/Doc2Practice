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
  ShieldAlert,
  School,
  Check,
  X,
  UserCheck,
  Activity,
  FileCheck,
  Server
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
import {
  getCurrentUser,
  getTeacherApprovalRequests,
  updateTeacherApprovalStatus,
  type UserProfile
} from '../services/auth';
import type { DocumentItem, QuizSet, UserStats, Classroom, ClassAssignment, TeacherApprovalRequest } from '../types';
import { DifficultyBadge } from '../components/common/Badge';
import { weeklyActivityData, mockSchools } from '../data/mockData';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [stats, setStats] = useState<UserStats>(getStats());
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<TeacherApprovalRequest[]>([]);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  const loadData = () => {
    setStats(getStats());
    setDocuments(getDocuments().slice(0, 3));
    setQuizSets(getQuizSets().slice(0, 3));
    setCurrentUser(getCurrentUser());
    setMistakesCount(getUniqueMistakes().length);
    setClassrooms(getClassrooms());
    setAssignments(getAssignments());
    setTeacherRequests(getTeacherApprovalRequests());
  };

  useEffect(() => {
    loadData();

    const handleAuthChange = () => setCurrentUser(getCurrentUser());
    const handleClassChange = () => {
      setClassrooms(getClassrooms());
      setAssignments(getAssignments());
    };
    const handleApprovalsChange = () => {
      setTeacherRequests(getTeacherApprovalRequests());
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    window.addEventListener('classes_updated', handleClassChange);
    window.addEventListener('assignments_updated', handleClassChange);
    window.addEventListener('teacher_approvals_updated', handleApprovalsChange);

    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
      window.removeEventListener('classes_updated', handleClassChange);
      window.removeEventListener('assignments_updated', handleClassChange);
      window.removeEventListener('teacher_approvals_updated', handleApprovalsChange);
    };
  }, []);

  const handleStartMistakesFromDashboard = () => {
    const newQuiz = createMistakeBankQuizSet();
    if (newQuiz) {
      navigate(`/app/quiz/${newQuiz.id}`);
    }
  };

  // Handler for School Admin approving / rejecting teacher
  const handleApprovalAction = (requestId: string, status: 'approved' | 'rejected') => {
    updateTeacherApprovalStatus(requestId, status);
    setTeacherRequests(getTeacherApprovalRequests());
    const actionText = status === 'approved' ? 'đã phê duyệt và kích hoạt' : 'đã từ chối';
    setApprovalFeedback(`Thành công: Hồ sơ ${actionText} tài khoản giáo viên.`);
    setTimeout(() => setApprovalFeedback(null), 3000);
  };

  const role = currentUser.role;
  const isTeacher = role === 'teacher';
  const isSchoolAdmin = role === 'school_admin';
  const isSystemAdmin = role === 'system_admin';
  const isStudent = role === 'student';

  const relevantClasses = isTeacher || isSchoolAdmin || isSystemAdmin
    ? classrooms
    : classrooms.filter((c) => c.studentIds.includes(currentUser.id));
  const examCount = assignments.filter((a) => a.type === 'exam').length;
  const pendingApprovals = teacherRequests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-8 pb-10">
      {/* Feedback Toast */}
      {approvalFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{approvalFeedback}</span>
          </div>
          <button onClick={() => setApprovalFeedback(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Role-Customized Welcome Banner */}
      <div className={`relative rounded-3xl p-6 sm:p-8 text-white shadow-lg overflow-hidden ${
        isSystemAdmin
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60'
          : isSchoolAdmin
          ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-indigo-800'
          : isTeacher
          ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-800'
          : 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm border border-white/20">
              {isSystemAdmin ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Trung tâm Điều hành Quốc gia Doc2Practice</span>
                </>
              ) : isSchoolAdmin ? (
                <>
                  <School className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ban Giám Hiệu • {currentUser.school || 'THPT Chuyên Lê Hồng Phong TP.HCM'}</span>
                </>
              ) : isTeacher ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tổ Chuyên môn: {currentUser.department || 'Tổ Toán - Tin học'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Chuỗi học tập: {stats.studyStreakDays} ngày liên tiếp 🔥</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào mừng {currentUser.fullName}!
            </h1>
            <p className="text-white/90 text-sm leading-relaxed">
              {isSystemAdmin
                ? 'Giám sát hạ tầng khảo thí số, mạng lưới trường học liên kết và nhật ký an toàn bảo mật trên toàn quốc.'
                : isSchoolAdmin
                ? `Quản lý vận hành kiểm định trực tuyến, phân công chuyên môn và phê duyệt cấp quyền tài khoản giáo viên cho ${currentUser.school || 'nhà trường'}.`
                : isTeacher
                ? 'Soạn đề kiểm tra từ tài liệu, quản lý các lớp học phần và giám sát học sinh làm bài thi trực tuyến chống gian lận.'
                : 'Biến giáo trình, slide bài giảng PDF, Word thành đề trắc nghiệm và thẻ flashcard ôn luyện hiệu quả.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            {isTeacher || isStudent ? (
              <Link
                to="/app/create-quiz"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <span>{isTeacher ? 'Tạo đề thi từ tài liệu' : 'Tạo bộ câu hỏi mới'}</span>
              </Link>
            ) : null}

            <Link
              to="/app/classes"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition-all hover:scale-105 active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>{isSchoolAdmin ? 'Xem toàn bộ Lớp học' : isSystemAdmin ? 'Giám sát Phòng thi' : 'Vào Lớp học'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. SCHOOL ADMIN SPECIAL VIEW: TEACHER APPROVALS & SCHOOL STATS */}
      {/* ============================================================== */}
      {isSchoolAdmin && (
        <div className="space-y-6 animate-fadeIn">
          {/* School Admin Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giáo viên trường</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">48 cán bộ</div>
                <div className="text-[11px] text-amber-600 font-medium mt-0.5">{pendingApprovals.length} hồ sơ chờ duyệt</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số Học sinh</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">1,240 em</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Khối 10, 11, 12</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp học phần</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{classrooms.length} lớp</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Đang hoạt động</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ thi có giám sát</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{examCount} kỳ thi</div>
                <div className="text-[11px] text-rose-600 font-medium mt-0.5">Khóa chống chuyển tab</div>
              </div>
            </div>
          </div>

          {/* Teacher Approval Workflow Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Phê duyệt Hồ sơ Giáo viên mới ({pendingApprovals.length} chờ xử lý)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quy trình kiểm soát danh tính sư phạm: Chỉ khi Ban Giám Hiệu phê duyệt, giáo viên mới có thể tạo lớp và giao đề thi.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Thẩm quyền: Ban Giám Hiệu
              </span>
            </div>

            {teacherRequests.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {teacherRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  return (
                    <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{req.fullName}</span>
                          <span className="text-xs text-slate-500">({req.email})</span>
                          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {req.teacherCode}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'approved'
                              ? '✓ Đã phê duyệt'
                              : req.status === 'rejected'
                              ? '✕ Đã từ chối'
                              : '⏳ Chờ thẩm định'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Trường: <strong>{req.schoolName}</strong></span>
                          <span>Tổ: <strong>{req.department}</strong></span>
                          <span>Tệp minh chứng: <code className="text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">{req.proofDocumentName}</code></span>
                          <span className="text-slate-400">Gửi lúc: {req.submittedAt}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprovalAction(req.id, 'approved')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Phê duyệt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprovalAction(req.id, 'rejected')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Đã lưu hồ sơ</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Hiện không có hồ sơ giáo viên nào cần phê duyệt.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SYSTEM ADMIN SPECIAL VIEW: NATIONAL NETWORK & HEALTH CHECK */}
      {/* ============================================================== */}
      {isSystemAdmin && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trường đối tác</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{mockSchools.length} trường</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">TP.HCM, Hà Nội, Đà Nẵng</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Người dùng hệ thống</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">8,420</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Giáo viên & Học sinh</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lượt thi trực tuyến</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">24,890</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Tỷ lệ hoàn thành 98.4%</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái hạ tầng</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">99.98%</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Uptime tuần qua</div>
              </div>
            </div>
          </div>

          {/* Partner Schools Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Mạng lưới Trường học Đối tác</h3>
                <p className="text-xs text-slate-500">Danh sách các trường THPT và Đại học đang triển khai Doc2Practice</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Hệ thống hoạt động bình thường
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Tên cơ sở giáo dục</th>
                    <th className="py-2.5 px-3">Mã đơn vị</th>
                    <th className="py-2.5 px-3">Địa phương</th>
                    <th className="py-2.5 px-3">Cấp học</th>
                    <th className="py-2.5 px-3">Gói bản quyền</th>
                    <th className="py-2.5 px-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockSchools.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{s.code}</td>
                      <td className="py-3 px-3 text-slate-600">{s.address}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                          {s.level === 'high_school' ? 'THPT' : 'Đại học'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-indigo-700 font-bold">Edu Enterprise</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Đang vận hành</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TEACHER & STUDENT STANDARD STAT METRIC CARDS */}
      {/* ============================================================== */}
      {(isTeacher || isStudent) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1: Số tài liệu */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isTeacher ? 'Tài liệu giảng dạy' : 'Tài liệu đã lưu'}
              </div>
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
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isTeacher ? 'Ngân hàng đề thi' : 'Bộ câu hỏi'}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalQuizSets}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isTeacher ? 'Sẵn sàng giao bài' : 'Sẵn sàng luyện thi'}
              </div>
            </div>
          </div>

          {/* Stat 3: Số câu đã làm */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isTeacher ? 'Lượt học sinh nộp' : 'Số câu đã luyện'}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {isTeacher ? '128 bài nộp' : stats.totalQuestionsAnswered}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>{isTeacher ? '+32 bài hôm nay' : '+15 câu tuần này'}</span>
              </div>
            </div>
          </div>

          {/* Stat 4: Điểm trung bình */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isTeacher ? 'Điểm trung bình lớp' : 'Điểm trung bình'}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.averageScore}%</div>
              <div className="text-[11px] text-amber-600 font-medium mt-0.5">Mức độ hiểu bài: Giỏi</div>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Hub Banner for Teacher / Student */}
      {(isTeacher || isStudent) && (
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
      )}

      {/* Mistake Bank Callout Banner (Students) */}
      {isStudent && mistakesCount > 0 && (
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

      {/* Progress Chart & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isTeacher ? 'Tần suất học sinh nộp bài 7 ngày qua' : 'Tiến độ luyện tập 7 ngày qua'}
              </h2>
              <p className="text-xs text-slate-500">
                {isTeacher
                  ? 'Số lượng bài tập và đề kiểm tra hoàn thành bởi học sinh các lớp'
                  : 'Số lượng câu trắc nghiệm bạn đã hoàn thành mỗi ngày'}
              </p>
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

        {/* Educational Advice Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-indigo-950">
                {isTeacher ? 'Phương pháp Khảo thí Số' : 'Bí quyết ôn luyện hiệu quả'}
              </h3>
              <p className="text-xs text-indigo-800/80 leading-relaxed mt-1">
                {isTeacher
                  ? 'Việc kích hoạt chế độ "Khóa màn hình & Chống chuyển tab" giúp giảm thiểu 95% hiện tượng tra cứu Google trong giờ thi trực tuyến.'
                  : 'Làm bài trắc nghiệm ngay sau khi đọc tài liệu giúp não bộ củng cố synap thần kinh. Đối với các câu làm sai, hãy dùng thẻ Flashcard để lặp lại sau 24 giờ.'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-100/80 text-xs text-slate-700 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{isTeacher ? 'Tạo đề kiểm tra 15 phút định kỳ' : 'Ôn lại 5 câu sai gần đây nhất'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-100/80 text-xs text-slate-700 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>{isTeacher ? 'Chia sẻ slide tài liệu trước buổi học' : 'Luyện Flashcard thuật ngữ chuyên ngành'}</span>
              </div>
            </div>
          </div>

          <Link
            to={isTeacher ? '/app/classes' : '/app/flashcards'}
            className="mt-6 inline-flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <span>{isTeacher ? 'Đến Quản lý Lớp học' : 'Đến trang Flashcard'}</span>
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
              <h2 className="text-base font-bold text-slate-900">
                {isTeacher ? 'Bộ đề thi trong ngân hàng' : 'Bộ câu hỏi gần đây'}
              </h2>
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
                    {isTeacher ? 'Xem trước' : 'Làm bài'}
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
              <h2 className="text-base font-bold text-slate-900">
                {isTeacher ? 'Tài liệu giáo án đã tải lên' : 'Tài liệu đã tải lên'}
              </h2>
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
