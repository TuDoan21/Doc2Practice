import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  PlusCircle,
  Copy,
  Check,
  FileCheck,
  Clock,
  ShieldAlert,
  BookOpen,
  Calendar,
  Eye,
  Award,
  Play,
  Sparkles
} from 'lucide-react';
import { getCurrentUser, switchUserRole, type UserProfile } from '../services/auth';
import {
  getClassrooms,
  createClassroom,
  joinClassroomByCode,
  getAssignmentsByClass,
  createAssignment,
  getSubmissionsByClass,
  getSubmissionsByAssignment
} from '../services/classService';
import { getQuizSets } from '../services/storage';
import type { Classroom, ClassAssignment, QuizSet, AssignmentType } from '../types';
import { Modal } from '../components/common/Modal';

export const ClassroomsPage = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const isTeacher = currentUser.role === 'teacher';

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [allQuizSets, setAllQuizSets] = useState<QuizSet[]>([]);

  // Selected Classroom for detail/assignments view
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Modals
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');

  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Giao bài tập cho giáo viên
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgQuizSetId, setAsgQuizSetId] = useState('');
  const [asgType, setAsgType] = useState<AssignmentType>('exam');
  const [asgDuration, setAsgDuration] = useState(30);
  const [asgDueDate, setAsgDueDate] = useState('2026-11-15');

  // Modal Báo cáo kết quả / Giám sát nộp bài cho giáo viên
  const [viewingAssignment, setViewingAssignment] = useState<ClassAssignment | null>(null);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const loadedClasses = getClassrooms();
    setClassrooms(loadedClasses);
    setAllQuizSets(getQuizSets());

    if (loadedClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(loadedClasses[0].id);
    }
  };

  useEffect(() => {
    refreshData();

    const handleUpdates = () => refreshData();
    window.addEventListener('auth_state_changed', handleUpdates);
    window.addEventListener('classes_updated', handleUpdates);
    window.addEventListener('assignments_updated', handleUpdates);
    window.addEventListener('submissions_updated', handleUpdates);

    return () => {
      window.removeEventListener('auth_state_changed', handleUpdates);
      window.removeEventListener('classes_updated', handleUpdates);
      window.removeEventListener('assignments_updated', handleUpdates);
      window.removeEventListener('submissions_updated', handleUpdates);
    };
  }, [selectedClassId]);

  const handleRoleToggle = (newRole: 'student' | 'teacher') => {
    switchUserRole(newRole);
    refreshData();
  };

  // Copy mã lớp
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Tạo lớp học mới (Giáo viên)
  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassSubject.trim()) return;

    const created = createClassroom({
      name: newClassName.trim(),
      subject: newClassSubject.trim(),
      description: newClassDesc.trim() || 'Lớp học trực tuyến trên Doc2Practice.',
    });

    setIsCreateClassOpen(false);
    setNewClassName('');
    setNewClassSubject('');
    setNewClassDesc('');
    setSelectedClassId(created.id);
    refreshData();
  };

  // Tham gia lớp học bằng code (Học sinh)
  const handleJoinClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinMessage(null);
    if (!joinCode.trim()) return;

    const res = joinClassroomByCode(joinCode.trim());
    if (res.success) {
      setJoinMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setIsJoinClassOpen(false);
        setJoinCode('');
        setJoinMessage(null);
        if (res.classroom) setSelectedClassId(res.classroom.id);
        refreshData();
      }, 1000);
    } else {
      setJoinMessage({ type: 'error', text: res.message });
    }
  };

  // Giao bài tập mới (Giáo viên)
  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !asgTitle.trim() || !asgQuizSetId) return;

    const selectedQuiz = allQuizSets.find((q) => q.id === asgQuizSetId);
    const totalQ = selectedQuiz ? selectedQuiz.questions.length : 5;

    createAssignment({
      classId: selectedClassId,
      title: asgTitle.trim(),
      quizSetId: asgQuizSetId,
      type: asgType,
      durationMinutes: asgDuration,
      preventTabSwitch: asgType === 'exam',
      maxTabSwitchViolations: asgType === 'exam' ? 3 : 0,
      dueDate: asgDueDate,
      totalQuestions: totalQ,
    });

    setIsCreateAssignmentOpen(false);
    setAsgTitle('');
    setAsgQuizSetId('');
    refreshData();
  };

  const selectedClass = classrooms.find((c) => c.id === selectedClassId) || classrooms[0];
  const assignments = selectedClass ? getAssignmentsByClass(selectedClass.id) : [];
  const submissions = selectedClass ? getSubmissionsByClass(selectedClass.id) : [];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Role Switcher Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isTeacher
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {isTeacher ? '👨‍🏫 Chế độ Giáo viên' : '🎓 Chế độ Học sinh / Sinh viên'}
            </span>
            <span className="text-xs text-slate-400">• Doc2Practice Classroom</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isTeacher ? 'Quản lý Lớp học & Đề thi' : 'Lớp học của tôi'}
          </h1>
          <p className="text-xs text-slate-500">
            {isTeacher
              ? 'Tạo lớp học, gửi mã PIN cho học sinh, giao bài kiểm tra chống chuyển tab và theo dõi điểm số thời gian thực.'
              : 'Tham gia lớp của giáo viên, làm bài kiểm tra chính thức và tự ôn tập bằng tài liệu cá nhân.'}
          </p>
        </div>

        {/* Quick Role Toggle for Demo / Testing */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 p-1.5 rounded-xl text-xs font-bold shrink-0">
          <span className="text-slate-400 px-2 font-medium">Chuyển vai trò:</span>
          <button
            type="button"
            onClick={() => handleRoleToggle('teacher')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              isTeacher ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Giáo viên</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleToggle('student')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              !isTeacher ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Học sinh</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Classrooms List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              {isTeacher ? 'Lớp học bạn phụ trách' : 'Lớp học đã tham gia'} ({classrooms.length})
            </h2>

            {isTeacher ? (
              <button
                type="button"
                onClick={() => setIsCreateClassOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tạo lớp</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsJoinClassOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Vào lớp (Mã PIN)</span>
              </button>
            )}
          </div>

          {classrooms.length > 0 ? (
            <div className="space-y-3">
              {classrooms.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                        {cls.subject}
                      </span>
                      {/* Class Code */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(cls.code);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Sao chép mã lớp để gửi cho học sinh"
                      >
                        {copiedCode === cls.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Mã: {cls.code}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {cls.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{cls.studentCount} học sinh</span>
                      </span>
                      <span>GV: {cls.teacherName.split(' ').slice(-2).join(' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              Chưa có lớp học nào. Hãy bấm tạo lớp hoặc nhập mã để bắt đầu.
            </div>
          )}

          {/* Student Independent Study Card */}
          {!isTeacher && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Góc tự học của bạn</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Ngoài các bài do giáo viên giao, bạn luôn có thể tự tải tệp tài liệu cá nhân để tạo bài trắc nghiệm và ôn flashcard riêng.
              </p>
              <Link
                to="/app/create-quiz"
                className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>Tải tài liệu tự học ngay</span>
                <span>→</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Classroom Detail (Assignments & Submissions) */}
        <div className="lg:col-span-2 space-y-5">
          {selectedClass ? (
            <div className="space-y-5">
              {/* Classroom Banner */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                      Mã PIN: {selectedClass.code}
                    </span>
                    <span className="text-xs text-slate-400">• Giáo viên: {selectedClass.teacherName}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedClass.name}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-xl">
                    {selectedClass.description}
                  </p>
                </div>

                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      if (allQuizSets.length > 0) setAsgQuizSetId(allQuizSets[0].id);
                      setIsCreateAssignmentOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102 shrink-0 self-start sm:self-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Giao bài tập / Bài thi</span>
                  </button>
                )}
              </div>

              {/* Assignments Section */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    <span>Danh sách bài tập & Đề kiểm tra ({assignments.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {isTeacher ? 'Quản lý bài kiểm tra cho cả lớp' : 'Hoàn thành trước hạn nộp'}
                  </span>
                </div>

                {assignments.length > 0 ? (
                  <div className="space-y-3">
                    {assignments.map((asg) => {
                      return (
                        <div
                          key={asg.id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {asg.type === 'exam' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  <span>Bài kiểm tra chính thức (Khóa chuyển tab)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <BookOpen className="w-3 h-3 text-indigo-600" />
                                  <span>Bài ôn tập tự do</span>
                                </span>
                              )}

                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{asg.durationMinutes} phút</span>
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Hạn: {asg.dueDate}</span>
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {asg.title}
                            </h4>

                            <div className="text-xs text-slate-500 flex items-center gap-3">
                              <span>Số câu: <strong>{asg.totalQuestions} câu</strong></span>
                              <span>•</span>
                              <span>Đã nộp: <strong className="text-indigo-600">{asg.submissionCount} học sinh</strong></span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isTeacher ? (
                              <button
                                type="button"
                                onClick={() => setViewingAssignment(asg)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Xem điểm & Vi phạm</span>
                              </button>
                            ) : (
                              <Link
                                to={`/app/quiz/${asg.quizSetId}?assignmentId=${asg.id}`}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all hover:scale-102 ${
                                  asg.type === 'exam'
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{asg.type === 'exam' ? 'Bắt đầu làm bài thi' : 'Làm bài ôn'}</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Chưa có bài tập nào được giao trong lớp này.
                  </div>
                )}
              </div>

              {/* Submissions Gradebook for Teacher */}
              {isTeacher && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Bảng điểm & Giám sát học sinh ({submissions.length} lượt nộp)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hệ thống tự động thông báo và ghi nhận số lần học sinh rời màn hình làm bài.
                      </p>
                    </div>
                  </div>

                  {submissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                          <tr>
                            <th className="py-2.5 px-3">Học sinh</th>
                            <th className="py-2.5 px-3">Bài nộp</th>
                            <th className="py-2.5 px-3">Điểm số</th>
                            <th className="py-2.5 px-3">Thời gian nộp</th>
                            <th className="py-2.5 px-3">Chuyển tab (Vi phạm)</th>
                            <th className="py-2.5 px-3">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {submissions.map((sub) => {
                            return (
                              <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-900">{sub.studentName}</div>
                                  <div className="text-[11px] text-slate-400">{sub.studentEmail}</div>
                                </td>
                                <td className="py-3 px-3 font-medium text-slate-700">
                                  {sub.className}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`font-black text-sm px-2 py-0.5 rounded ${
                                    sub.score >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-800 bg-slate-100'
                                  }`}>
                                    {sub.score}%
                                  </span>
                                  <span className="text-[10px] text-slate-400 ml-1">({sub.correctCount}/{sub.totalQuestions} câu)</span>
                                </td>
                                <td className="py-3 px-3 text-slate-500">
                                  {sub.submittedAt}
                                </td>
                                <td className="py-3 px-3">
                                  {sub.tabSwitchCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                                      <span>{sub.tabSwitchCount} lần vi phạm</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                                      <Check className="w-3 h-3" />
                                      <span>Nghiêm túc (0 lần)</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {sub.status === 'violation_auto_submitted' ? (
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                                      Bị thu bài tự động
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                      Hoàn thành hợp lệ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Chưa có học sinh nào nộp bài trong lớp này.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              Vui lòng chọn một lớp học ở danh sách bên trái.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tạo lớp học mới (Giáo viên) */}
      <Modal isOpen={isCreateClassOpen} onClose={() => setIsCreateClassOpen(false)} title="Tạo Lớp Học Mới" maxWidth="md">
        <form onSubmit={handleCreateClassSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Tên lớp học</label>
            <input
              type="text"
              required
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="VD: Lập trình Web & React TypeScript (SE104.P12)"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Môn học / Chuyên ngành</label>
            <input
              type="text"
              required
              value={newClassSubject}
              onChange={(e) => setNewClassSubject(e.target.value)}
              placeholder="VD: Công nghệ phần mềm / Khoa học máy tính"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Mô tả ngắn cho lớp</label>
            <textarea
              rows={3}
              value={newClassDesc}
              onChange={(e) => setNewClassDesc(e.target.value)}
              placeholder="Mục tiêu của lớp học, tài liệu cần chuẩn bị..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Sau khi tạo, hệ thống sẽ tự động cấp một mã PIN 6 ký tự để bạn gửi cho học sinh tham gia.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateClassOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              Tạo lớp ngay
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Tham gia lớp bằng mã PIN (Học sinh) */}
      <Modal isOpen={isJoinClassOpen} onClose={() => setIsJoinClassOpen(false)} title="Tham Gia Lớp Học Bằng Mã" maxWidth="md">
        <form onSubmit={handleJoinClassSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Nhập mã lớp do giáo viên cung cấp</label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="VD: WEB-8821 hoặc AI-2026"
              className="w-full px-4 py-3 text-sm font-mono font-bold tracking-wider text-center uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Mã lớp học gồm các chữ cái và số ngăn cách bởi dấu gạch nối (VD: WEB-8821).
            </p>
          </div>

          {joinMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              joinMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {joinMessage.text}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsJoinClassOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Tham gia ngay
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Giao bài tập / bài kiểm tra mới (Giáo viên) */}
      <Modal isOpen={isCreateAssignmentOpen} onClose={() => setIsCreateAssignmentOpen(false)} title="Giao Bài Tập / Bài Kiểm Tra Cho Lớp" maxWidth="lg">
        <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Tiêu đề bài làm</label>
            <input
              type="text"
              required
              value={asgTitle}
              onChange={(e) => setAsgTitle(e.target.value)}
              placeholder="VD: Bài kiểm tra 30 phút: Kiến trúc Component & State"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Chọn bộ câu hỏi từ kho đề</label>
              <select
                value={asgQuizSetId}
                onChange={(e) => setAsgQuizSetId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
              >
                {allQuizSets.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.questions.length} câu)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Hình thức làm bài</label>
              <select
                value={asgType}
                onChange={(e) => setAsgType(e.target.value as AssignmentType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
              >
                <option value="exam">🔒 Bài kiểm tra chính thức (Khóa chuyển tab)</option>
                <option value="practice">📖 Bài ôn tập tự do (Cho xem giải thích)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Thời gian làm bài (Phút)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={asgDuration}
                onChange={(e) => setAsgDuration(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Hạn chót nộp bài</label>
              <input
                type="date"
                value={asgDueDate}
                onChange={(e) => setAsgDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {asgType === 'exam' && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Quy chế thi chống gian lận được kích hoạt</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-600">
                Khi học sinh làm bài này, nếu chuyển sang tab khác hoặc thu nhỏ cửa sổ, hệ thống sẽ cảnh báo đỏ toàn màn hình, ghi lại số lần vi phạm và tự động gửi thông báo về bảng điều khiển của bạn!
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateAssignmentOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              Xác nhận giao bài
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Báo cáo kết quả bài kiểm tra cụ thể cho Giáo viên */}
      <Modal isOpen={Boolean(viewingAssignment)} onClose={() => setViewingAssignment(null)} title={`Báo Cáo Điểm: ${viewingAssignment?.title || ''}`} maxWidth="xl">
        {viewingAssignment && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-indigo-900">Lớp:</span> {viewingAssignment.className} • <span className="font-bold text-indigo-900">Thời gian:</span> {viewingAssignment.durationMinutes} phút
              </div>
              <div className="font-bold text-indigo-700">
                Đã nộp: {viewingAssignment.submissionCount} bài
              </div>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Học sinh</th>
                    <th className="py-2 px-3">Điểm số</th>
                    <th className="py-2 px-3">Thời gian nộp</th>
                    <th className="py-2 px-3">Rời màn hình thi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getSubmissionsByAssignment(viewingAssignment.id).map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                        <div className="text-[10px] text-slate-400">{sub.studentEmail}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-black text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {sub.score}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{sub.submittedAt}</td>
                      <td className="py-2.5 px-3">
                        {sub.tabSwitchCount > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            ⚠️ {sub.tabSwitchCount} lần vi phạm
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-semibold">0 lần (Tuân thủ tốt)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {getSubmissionsByAssignment(viewingAssignment.id).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        Chưa có học sinh nào nộp bài kiểm tra này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingAssignment(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
