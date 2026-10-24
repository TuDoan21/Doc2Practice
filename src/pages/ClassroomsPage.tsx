import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Sparkles,
  Radio,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Zap,
  Download,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FolderOpen
} from 'lucide-react';
import { getCurrentUser, type UserProfile } from '../services/auth';
import {
  getClassrooms,
  createClassroom,
  joinClassroomByCode,
  getAssignmentsByClass,
  getAssignmentById,
  createAssignment,
  getSubmissionsByClass,
  getSubmissionsByAssignment,
  simulateStudentTabViolation,
  getClassMaterials,
  addClassMaterial
} from '../services/classService';
import { getQuizSets } from '../services/storage';
import type { Classroom, ClassAssignment, QuizSet, AssignmentType, StudentSubmission, ClassMaterial } from '../types';
import { Modal } from '../components/common/Modal';

export const ClassroomsPage = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const isTeacher = currentUser.role === 'teacher';

  const [searchParams, setSearchParams] = useSearchParams();
  const monitorParam = searchParams.get('monitor');
  const assignQuizParam = searchParams.get('assignQuiz');

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [allQuizSets, setAllQuizSets] = useState<QuizSet[]>([]);

  // Selected Classroom for detail/assignments view
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Live Exam Proctoring Mode for Teachers
  const [monitoringAssignmentId, setMonitoringAssignmentId] = useState<string | null>(monitorParam);
  const [liveViolationAlert, setLiveViolationAlert] = useState<{
    studentName: string;
    studentEmail: string;
    violationCount: number;
    timestamp: string;
    autoSubmitted?: boolean;
  } | null>(null);
  const [proctorFilter, setProctorFilter] = useState<'all' | 'taking' | 'submitted' | 'violation'>('all');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentSubmission | null>(null);

  // Modals
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');

  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Giao bài tập cho giáo viên
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(Boolean(assignQuizParam));
  const [asgTitle, setAsgTitle] = useState('');
  const [asgQuizSetId, setAsgQuizSetId] = useState(assignQuizParam || '');
  const [asgType, setAsgType] = useState<AssignmentType>('exam');
  const [asgDuration, setAsgDuration] = useState(30);
  const [asgDueDate, setAsgDueDate] = useState('2026-11-15');

  // Modal Báo cáo kết quả / Giám sát nộp bài cho giáo viên
  const [viewingAssignment, setViewingAssignment] = useState<ClassAssignment | null>(null);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Âm thanh cảnh báo gian lận nhẹ nhàng
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  };

  const refreshData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const loadedClasses = getClassrooms();
    setClassrooms(loadedClasses);
    const loadedQuiz = getQuizSets();
    setAllQuizSets(loadedQuiz);

    if (assignQuizParam && !asgQuizSetId) {
      setAsgQuizSetId(assignQuizParam);
      const foundQ = loadedQuiz.find((q) => q.id === assignQuizParam);
      if (foundQ) setAsgTitle(`Kiểm tra: ${foundQ.title}`);
      setIsCreateAssignmentOpen(true);
    }

    if (loadedClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(loadedClasses[0].id);
    }
  };

  useEffect(() => {
    if (monitorParam) {
      setMonitoringAssignmentId(monitorParam);
    }
  }, [monitorParam]);

  useEffect(() => {
    refreshData();

    const handleUpdates = () => refreshData();
    const handleViolationDetected = (e: any) => {
      if (e.detail) {
        setLiveViolationAlert(e.detail);
        playAlertSound();
      }
      refreshData();
    };

    window.addEventListener('auth_state_changed', handleUpdates);
    window.addEventListener('classes_updated', handleUpdates);
    window.addEventListener('assignments_updated', handleUpdates);
    window.addEventListener('submissions_updated', handleUpdates);
    window.addEventListener('exam_tab_violation_detected', handleViolationDetected);

    return () => {
      window.removeEventListener('auth_state_changed', handleUpdates);
      window.removeEventListener('classes_updated', handleUpdates);
      window.removeEventListener('assignments_updated', handleUpdates);
      window.removeEventListener('submissions_updated', handleUpdates);
      window.removeEventListener('exam_tab_violation_detected', handleViolationDetected);
    };
  }, [selectedClassId, monitorParam, assignQuizParam]);

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
  const materials = selectedClass ? getClassMaterials(selectedClass.id) : [];

  const [activeTab, setActiveTab] = useState<'assignments' | 'materials' | 'members' | 'gradebook'>('assignments');
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matFileName, setMatFileName] = useState('');
  const [matFileType, setMatFileType] = useState<'pdf' | 'docx' | 'pptx' | 'text'>('pdf');
  const [matFileSize, setMatFileSize] = useState('2.4 MB');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const handleUploadMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !matTitle.trim() || !matFileName.trim()) return;

    addClassMaterial({
      classId: selectedClass.id,
      title: matTitle.trim(),
      fileName: matFileName.trim(),
      fileSize: matFileSize || '2.5 MB',
      fileType: matFileType,
    });

    setIsUploadMaterialOpen(false);
    setMatTitle('');
    setMatFileName('');
    setActionToast('Tải tài liệu môn học thành công!');
    setTimeout(() => setActionToast(null), 3000);
    refreshData();
  };

  const handleDownloadMaterial = (m: ClassMaterial) => {
    m.downloadCount += 1;
    setActionToast(`Bắt đầu tải tệp: ${m.fileName} (${m.fileSize})`);
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleExportGradebook = () => {
    setActionToast(`Đã xuất bảng điểm lớp ${selectedClass?.name || ''} ra tệp Excel chuẩn (D2P_Bang_Diem.xlsx)!`);
    setTimeout(() => setActionToast(null), 3500);
  };

  const monitoringAssignment = monitoringAssignmentId ? getAssignmentById(monitoringAssignmentId) : null;
  const monitoringSubmissions = monitoringAssignmentId ? getSubmissionsByAssignment(monitoringAssignmentId) : [];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionToast}</span>
        </div>
      )}
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isTeacher
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isTeacher ? '👨‍🏫 Quyền hạn: Giáo viên / Giảng viên' : '🎓 Quyền hạn: Học sinh / Sinh viên'}
            </span>
            <span className="text-xs text-slate-400">• Doc2Practice Classroom</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isTeacher ? 'Quản lý Lớp học & Phòng Giám Sát Đề Thi' : 'Lớp học & Bài tập của tôi'}
          </h1>
          <p className="text-xs text-slate-500">
            {isTeacher
              ? 'Tạo lớp học, gửi mã PIN, giao đề thi chống chuyển tab và giám sát trực tiếp sinh viên làm bài với cảnh báo gian lận.'
              : 'Tham gia lớp của giáo viên bằng mã PIN để làm bài tập, bài thi hoặc tự do tải tài liệu cá nhân để ôn luyện riêng.'}
          </p>
        </div>

        {/* User Identity Info */}
        <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 self-start md:self-auto flex items-center gap-2.5">
          {isTeacher ? (
            <GraduationCap className="w-4 h-4 text-amber-600" />
          ) : (
            <Users className="w-4 h-4 text-emerald-600" />
          )}
          <span>{currentUser.fullName} ({currentUser.email})</span>
        </div>
      </div>

      {/* ================= LIVE PROCTORING VIEW FOR TEACHERS ================= */}
      {isTeacher && monitoringAssignment ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Back button and title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMonitoringAssignmentId(null);
                  setSearchParams({});
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Quay lại danh sách lớp"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại lớp học</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
                    <Radio className="w-3 h-3" />
                    <span>PHÒNG GIÁM SÁT TRỰC TIẾP (LIVE)</span>
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">• Mã phòng thi: {selectedClass?.code || 'WEB-8821'}</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  {monitoringAssignment.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lớp: <strong>{monitoringAssignment.className}</strong> • Thời lượng: <strong>{monitoringAssignment.durationMinutes} phút</strong> • Hạn nộp: <strong>{monitoringAssignment.dueDate}</strong> • Số câu: <strong>{monitoringAssignment.totalQuestions} câu</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  simulateStudentTabViolation(monitoringAssignment.id);
                  refreshData();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
                title="Bấm để thử nghiệm cơ chế phát hiện và cảnh báo thoát tab thời gian thực"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>⚡ Thử nghiệm cảnh báo thoát tab</span>
              </button>
              <button
                type="button"
                onClick={refreshData}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Làm mới dữ liệu phòng thi"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Alert Banner if any student exits tab */}
          {liveViolationAlert && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white shadow-lg border border-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-bounce-once">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/30 tracking-wider">
                      CẢNH BÁO GIAN LẬN THỜI GIAN THỰC
                    </span>
                    <span className="text-[11px] text-rose-200">{liveViolationAlert.timestamp}</span>
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base mt-0.5">
                    Học sinh {liveViolationAlert.studentName} ({liveViolationAlert.studentEmail}) vừa rời khỏi màn hình làm bài!
                  </h4>
                  <p className="text-xs text-rose-100">
                    Số lần vi phạm: <strong>{liveViolationAlert.violationCount}/3 lần</strong>.{' '}
                    {liveViolationAlert.autoSubmitted
                      ? '🚨 ĐÃ VƯỢT QUÁ 3 LẦN: HỆ THỐNG ĐÃ TỰ ĐỘNG KHÓA VÀ THU BÀI.'
                      : 'Hệ thống đã hiển thị cảnh báo đỏ trên màn hình của học sinh.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLiveViolationAlert(null)}
                className="px-4 py-2 rounded-xl bg-white text-rose-800 font-bold text-xs shadow-xs hover:bg-rose-50 transition-colors shrink-0 self-start sm:self-auto"
              >
                Xác nhận đã xử lý
              </button>
            </div>
          )}

          {/* 4 Stat Metric Cards for Proctoring */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Sĩ số lớp</div>
                <div className="text-lg font-black text-slate-900">{selectedClass?.studentCount || 32} học sinh</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Đang làm bài</div>
                <div className="text-lg font-black text-blue-600">
                  {monitoringSubmissions.filter((s) => s.status === 'taking').length} thí sinh
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Đã hoàn thành</div>
                <div className="text-lg font-black text-emerald-600">
                  {monitoringSubmissions.filter((s) => s.status === 'submitted' || s.status === 'violation_auto_submitted').length} bài nộp
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Vi phạm thoát tab</div>
                <div className="text-lg font-black text-rose-600">
                  {monitoringSubmissions.filter((s) => s.tabSwitchCount > 0).length} học sinh
                </div>
              </div>
            </div>
          </div>

          {/* Student Proctoring Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>Bảng theo dõi thí sinh theo thời gian thực</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật tức thì khi sinh viên làm bài, nộp bài hoặc bị phát hiện rời khỏi tab thi
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setProctorFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    proctorFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tất cả ({monitoringSubmissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProctorFilter('taking')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    proctorFilter === 'taking' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Đang làm ({monitoringSubmissions.filter((s) => s.status === 'taking').length})
                </button>
                <button
                  type="button"
                  onClick={() => setProctorFilter('violation')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    proctorFilter === 'violation' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚠️ Có vi phạm ({monitoringSubmissions.filter((s) => s.tabSwitchCount > 0).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Học sinh / Thí sinh</th>
                    <th className="py-2.5 px-3">Trạng thái thi</th>
                    <th className="py-2.5 px-3">Giám sát Thoát Tab (Anti-Cheat)</th>
                    <th className="py-2.5 px-3">Điểm số</th>
                    <th className="py-2.5 px-3">Thời gian nộp</th>
                    <th className="py-2.5 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monitoringSubmissions
                    .filter((sub) => {
                      if (proctorFilter === 'taking') return sub.status === 'taking';
                      if (proctorFilter === 'submitted') return sub.status === 'submitted' || sub.status === 'violation_auto_submitted';
                      if (proctorFilter === 'violation') return sub.tabSwitchCount > 0;
                      return true;
                    })
                    .map((sub) => {
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{sub.studentName}</div>
                            <div className="text-[11px] text-slate-400">{sub.studentEmail}</div>
                          </td>
                          <td className="py-3 px-3">
                            {sub.status === 'taking' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                                <span>Đang làm bài...</span>
                              </span>
                            ) : sub.status === 'violation_auto_submitted' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                <span>Bị khóa & Thu bài do gian lận</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đã nộp bài</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {sub.tabSwitchCount === 0 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>0 lần (Tuân thủ tốt)</span>
                              </span>
                            ) : sub.tabSwitchCount >= 3 || sub.status === 'violation_auto_submitted' ? (
                              <div className="inline-flex flex-col">
                                <span className="inline-flex items-center gap-1 font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 animate-pulse">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                  <span>🚨 Thoát tab {sub.tabSwitchCount} lần (Khóa bài)</span>
                                </span>
                                {sub.lastViolationTime && (
                                  <span className="text-[10px] text-slate-400 mt-0.5">Lần cuối: {sub.lastViolationTime}</span>
                                )}
                              </div>
                            ) : (
                              <div className="inline-flex flex-col">
                                <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>⚠️ Thoát tab {sub.tabSwitchCount}/3 lần</span>
                                </span>
                                {sub.lastViolationTime && (
                                  <span className="text-[10px] text-slate-400 mt-0.5">Lần cuối: {sub.lastViolationTime}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {sub.status === 'taking' ? (
                              <span className="text-slate-400 italic">Chưa nộp bài</span>
                            ) : (
                              <div>
                                <span className={`font-black text-sm px-2 py-0.5 rounded ${
                                  sub.score >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-800 bg-slate-100'
                                }`}>
                                  {sub.score}%
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1">({sub.correctCount}/{sub.totalQuestions} câu)</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {sub.submittedAt}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentDetail(sub)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                            >
                              Xem nhật ký
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= STANDARD CLASSROOM LIST & ASSIGNMENTS VIEW ================= */
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

              {/* Classroom Hub 4-Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto text-xs font-bold scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('assignments')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'assignments'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Đề thi & Bài tập</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'assignments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {assignments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('materials')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'materials'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Tài liệu học tập</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'materials' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {materials.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('members')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'members'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Thành viên lớp</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'members' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedClass.studentCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('gradebook')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'gradebook'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Sổ điểm & Thống kê</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'gradebook' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {submissions.length}
                  </span>
                </button>
              </div>

              {/* ================= TAB 1: ASSIGNMENTS & EXAMS ================= */}
              {activeTab === 'assignments' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-fadeIn">
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
                      {assignments.map((asg) => (
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
                              <div className="flex flex-wrap items-center gap-2">
                                {asg.type === 'exam' ? (
                                  <button
                                    type="button"
                                    onClick={() => setMonitoringAssignmentId(asg.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
                                  >
                                    <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                    <span>Phòng Giám Sát Trực Tiếp</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setMonitoringAssignmentId(asg.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Theo dõi tiến độ</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setViewingAssignment(asg)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-colors"
                                  title="Xem bảng điểm bài nộp"
                                >
                                  <Award className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Bảng điểm</span>
                                </button>
                              </div>
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
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Chưa có bài tập nào được giao trong lớp này.
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 2: CLASS MATERIALS ================= */}
              {activeTab === 'materials' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-indigo-600" />
                        <span>Kho tài liệu bài giảng môn học ({materials.length})</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tài liệu chính thức do giáo viên cung cấp để học sinh tải về và ôn tập
                      </p>
                    </div>

                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => setIsUploadMaterialOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102 shrink-0 self-start sm:self-auto"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Thêm tài liệu mới</span>
                      </button>
                    )}
                  </div>

                  {materials.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {materials.map((mat) => (
                        <div key={mat.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              mat.fileType === 'pdf'
                                ? 'bg-rose-50 text-rose-600'
                                : mat.fileType === 'pptx'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors truncate">
                                {mat.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-slate-500">{mat.fileName}</span>
                                <span>•</span>
                                <span>{mat.fileSize}</span>
                                <span>•</span>
                                <span>GV: {mat.uploadedBy}</span>
                                <span>•</span>
                                <span>{mat.uploadedAt}</span>
                                <span>•</span>
                                <span className="text-indigo-600 font-medium">{mat.downloadCount} lượt tải</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleDownloadMaterial(mat)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                              title="Tải tệp về máy"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải về</span>
                            </button>

                            <Link
                              to={`/app/create-quiz?doc=${encodeURIComponent(mat.fileName)}&size=${encodeURIComponent(mat.fileSize)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Tạo bài ôn từ file</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Chưa có tài liệu nào được tải lên cho lớp học này.
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 3: CLASS MEMBERS ================= */}
              {activeTab === 'members' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5 animate-fadeIn">
                  {/* Teacher Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm shrink-0">
                        👨‍🏫
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Giáo viên phụ trách bộ môn</div>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{selectedClass.teacherName}</h4>
                        <p className="text-xs text-slate-500">Tổ Chuyên Môn Toán - Tin • doc2practice.edu.vn</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(selectedClass.code)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-xs transition-all shrink-0 self-start sm:self-auto"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{copiedCode === selectedClass.code ? 'Đã sao chép mã!' : `Mã mời: ${selectedClass.code}`}</span>
                    </button>
                  </div>

                  {/* Student Roster */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Danh sách học sinh trong lớp ({selectedClass.studentCount} em)</span>
                      </h4>
                      <span className="text-xs text-emerald-600 font-bold">100% tài khoản đã kích hoạt</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                          <tr>
                            <th className="py-2.5 px-3">Mã học sinh</th>
                            <th className="py-2.5 px-3">Họ và tên</th>
                            <th className="py-2.5 px-3">Email trường học</th>
                            <th className="py-2.5 px-3">Ngày tham gia</th>
                            <th className="py-2.5 px-3 text-right">Kỷ luật thi cử</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-700">HS-2026-0812</td>
                            <td className="py-3 px-3 font-bold text-slate-900">Nguyễn Văn Học (Bạn)</td>
                            <td className="py-3 px-3 text-slate-500">hoc.nv@student.edu.vn</td>
                            <td className="py-3 px-3 text-slate-400">20/10/2026</td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                <span>Gương mẫu (0 vi phạm)</span>
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-600">HS-2026-0815</td>
                            <td className="py-3 px-3 font-bold text-slate-900">Lê Thị Mai</td>
                            <td className="py-3 px-3 text-slate-500">mai.lt@student.edu.vn</td>
                            <td className="py-3 px-3 text-slate-400">20/10/2026</td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                <span>Gương mẫu (0 vi phạm)</span>
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-600">HS-2026-0820</td>
                            <td className="py-3 px-3 font-bold text-slate-900">Trần Bảo Long</td>
                            <td className="py-3 px-3 text-slate-500">long.tb@student.edu.vn</td>
                            <td className="py-3 px-3 text-slate-400">21/10/2026</td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                <span>⚠️ 1 lần thoát tab</span>
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-600">HS-2026-0822</td>
                            <td className="py-3 px-3 font-bold text-slate-900">Phạm Minh Trang</td>
                            <td className="py-3 px-3 text-slate-500">trang.pm@student.edu.vn</td>
                            <td className="py-3 px-3 text-slate-400">21/10/2026</td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                <span>Gương mẫu (0 vi phạm)</span>
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 4: GRADEBOOK & STATISTICS ================= */}
              {activeTab === 'gradebook' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Sổ điểm & Báo cáo kết quả ({submissions.length} bài nộp)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tổng hợp kết quả làm bài tập và bài kiểm tra có giám sát chống gian lận
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportGradebook}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all hover:scale-102 shrink-0 self-start sm:self-auto"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Xuất bảng điểm (Excel)</span>
                    </button>
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
                          {submissions.map((sub) => (
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
                          ))}
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
      )}

      {/* Modal: Chi tiết bài làm & Nhật ký giám sát học sinh */}
      <Modal
        isOpen={Boolean(selectedStudentDetail)}
        onClose={() => setSelectedStudentDetail(null)}
        title={selectedStudentDetail ? `Nhật Ký Thí Sinh: ${selectedStudentDetail.studentName}` : ''}
        maxWidth="md"
      >
        {selectedStudentDetail && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-bold text-slate-900">{selectedStudentDetail.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-700">{selectedStudentDetail.studentEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className={`font-bold ${
                  selectedStudentDetail.status === 'violation_auto_submitted'
                    ? 'text-rose-600'
                    : selectedStudentDetail.status === 'taking'
                    ? 'text-blue-600'
                    : 'text-emerald-600'
                }`}>
                  {selectedStudentDetail.status === 'violation_auto_submitted'
                    ? 'Bị khóa bài do gian lận'
                    : selectedStudentDetail.status === 'taking'
                    ? 'Đang làm bài'
                    : 'Đã hoàn thành'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm số:</span>
                <span className="font-black text-slate-900">
                  {selectedStudentDetail.status === 'taking' ? 'Chưa nộp' : `${selectedStudentDetail.score}% (${selectedStudentDetail.correctCount}/${selectedStudentDetail.totalQuestions} câu)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian làm bài:</span>
                <span className="font-medium text-slate-700">{Math.round(selectedStudentDetail.durationSeconds / 60)} phút</span>
              </div>
            </div>

            {/* Anti-Cheat Log details */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              selectedStudentDetail.tabSwitchCount > 0
                ? 'bg-rose-50/60 border-rose-200'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}>
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <ShieldAlert className={`w-4 h-4 ${selectedStudentDetail.tabSwitchCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                <span>Nhật ký giám sát Chống Chuyển Tab (Anti-Cheat)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {selectedStudentDetail.tabSwitchCount === 0
                  ? 'Thí sinh tuân thủ 100% quy chế thi, không ghi nhận bất kỳ lần rời màn hình thi nào.'
                  : `Phát hiện ${selectedStudentDetail.tabSwitchCount} lần rời khỏi màn hình làm bài thi. ${
                      selectedStudentDetail.status === 'violation_auto_submitted'
                        ? 'Hệ thống đã tự động khóa và thu bài để đảm bảo tính công bằng.'
                        : 'Hệ thống đã ghi nhận và cảnh báo học sinh.'
                    }`}
              </p>
              {selectedStudentDetail.lastViolationTime && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Thời điểm vi phạm gần nhất: {selectedStudentDetail.lastViolationTime}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

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

      {/* Modal: Tải tài liệu môn học mới lên Lớp */}
      <Modal
        isOpen={isUploadMaterialOpen}
        onClose={() => setIsUploadMaterialOpen(false)}
        title="Tải Tài Liệu / Bài Giảng Lên Lớp Học"
        maxWidth="md"
      >
        <form onSubmit={handleUploadMaterialSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Tiêu đề tài liệu / Bài giảng *</label>
            <input
              type="text"
              required
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              placeholder="VD: Đề cương Ôn tập Chương 3 & Bài tập áp dụng"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Định dạng tệp</label>
              <select
                value={matFileType}
                onChange={(e) => setMatFileType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
              >
                <option value="pdf">Tệp PDF (.pdf)</option>
                <option value="docx">Văn bản Word (.docx)</option>
                <option value="pptx">Slide PowerPoint (.pptx)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Dung lượng ước tính</label>
              <input
                type="text"
                value={matFileSize}
                onChange={(e) => setMatFileSize(e.target.value)}
                placeholder="VD: 3.2 MB"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Tên tệp lưu trữ *</label>
            <input
              type="text"
              required
              value={matFileName}
              onChange={(e) => setMatFileName(e.target.value)}
              placeholder="VD: De_cuong_on_tap_chuong_3.pdf"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
            />
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 leading-relaxed">
            💡 Tài liệu sau khi tải lên sẽ hiển thị ngay cho toàn bộ học sinh trong lớp tải về và có thể tạo câu hỏi trắc nghiệm tự động trực tiếp bằng AI.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadMaterialOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Tải lên lớp học
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
