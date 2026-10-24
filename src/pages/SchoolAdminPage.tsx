import { useState, useEffect } from 'react';
import {
  School,
  Users,
  CheckCircle2,
  Search,
  UserCheck,
  FileCheck,
  Building
} from 'lucide-react';
import { getCurrentUser, getTeacherApprovalRequests, getSessionToken } from '../services/auth';
import { getSchoolById, getSchoolMembers } from '../services/schoolService';
import { getClassrooms, assignTeacherToClass } from '../services/classService';
import { approveTeacherApi, rejectTeacherApi } from '../services/authApi';
import type { School as SchoolType, Classroom, TeacherApprovalRequest } from '../types';
import { Modal } from '../components/common/Modal';

export const SchoolAdminPage = () => {
  const currentUser = getCurrentUser();
  const schoolId = currentUser.schoolId || 'school-lhp';

  const [school, setSchool] = useState<SchoolType | undefined>(getSchoolById(schoolId));
  const [activeTab, setActiveTab] = useState<'members' | 'approvals' | 'classes'>('members');

  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [memberSearch, setMemberSearch] = useState('');

  // Approvals state
  const [approvals, setApprovals] = useState<TeacherApprovalRequest[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Classes state
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [assignTeacherModalOpen, setAssignTeacherModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [newTeacherId, setNewTeacherId] = useState('');

  const loadData = () => {
    setSchool(getSchoolById(schoolId));
    const membersRes = getSchoolMembers(schoolId, {
      role: memberRoleFilter === 'all' ? undefined : (memberRoleFilter as any),
      search: memberSearch,
    });
    if (membersRes.success) {
      setMembers(membersRes.data);
    }

    const allApprovals = getTeacherApprovalRequests();
    // School Admin chỉ duyệt giáo viên của trường mình
    setApprovals(allApprovals.filter((a: TeacherApprovalRequest) => !a.schoolId || a.schoolId === schoolId));

    const allClasses = getClassrooms();
    setClasses(allClasses.filter((c) => c.schoolId === schoolId));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('schools_updated', handleUpdate);
    window.addEventListener('classes_updated', handleUpdate);
    window.addEventListener('teacher_approvals_updated', handleUpdate);
    return () => {
      window.removeEventListener('schools_updated', handleUpdate);
      window.removeEventListener('classes_updated', handleUpdate);
      window.removeEventListener('teacher_approvals_updated', handleUpdate);
    };
  }, [memberRoleFilter, memberSearch]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApproveTeacher = async (reqId: string) => {
    const token = getSessionToken() || '';
    const res = await approveTeacherApi(token, reqId);
    if (res.success) {
      showToast('Đã phê duyệt tài khoản giáo viên thành công!');
      loadData();
    } else {
      alert(res.error.message);
    }
  };

  const handleRejectTeacher = async (reqId: string) => {
    const reason = prompt('Nhập lý do từ chối hồ sơ:', 'Hồ sơ thiếu minh chứng phân công giảng dạy');
    if (reason === null) return;

    const token = getSessionToken() || '';
    const res = await rejectTeacherApi(token, reqId, reason);
    if (res.success) {
      showToast('Đã từ chối hồ sơ giáo viên.');
      loadData();
    } else {
      alert(res.error.message);
    }
  };

  const handleOpenAssignTeacher = (cls: Classroom) => {
    setSelectedClass(cls);
    setNewTeacherId(cls.teacherId);
    setAssignTeacherModalOpen(true);
  };

  const handleAssignTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newTeacherId) return;

    const allTeachers = members.filter((m) => m.role === 'teacher');
    const teacherObj = allTeachers.find((t) => t.id === newTeacherId);
    const teacherName = teacherObj ? teacherObj.fullName : 'Giáo viên';

    const res = assignTeacherToClass({
      classId: selectedClass.id,
      teacherId: newTeacherId,
      teacherName,
    });

    if (res.success) {
      setAssignTeacherModalOpen(false);
      showToast(res.message || 'Phân công giáo viên thành công!');
      loadData();
    } else {
      alert(res.error.message);
    }
  };

  const availableTeachers = members.filter((m) => m.role === 'teacher' && m.status === 'active');
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* School Overview Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-700 via-amber-600 to-indigo-800 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm border border-white/20">
              <Building className="w-3.5 h-3.5 text-amber-300" />
              <span>Ban Giám Hiệu • {school?.name || 'Trường học'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản trị Trường học & Phân công Sư phạm
            </h1>
            <p className="text-white/90 text-sm max-w-2xl">
              Quản lý toàn bộ hồ sơ giáo viên, danh sách học sinh, phân bổ chuyên môn và duyệt hồ sơ tuyển dụng sư phạm cho trường học.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-white/10 text-center shrink-0">
            <div>
              <div className="text-[10px] text-amber-200 font-semibold uppercase">Giáo viên</div>
              <div className="text-lg font-black text-white">{availableTeachers.length}</div>
            </div>
            <div>
              <div className="text-[10px] text-amber-200 font-semibold uppercase">Học sinh</div>
              <div className="text-lg font-black text-white">{members.filter((m) => m.role === 'student').length}</div>
            </div>
            <div>
              <div className="text-[10px] text-amber-200 font-semibold uppercase">Lớp học</div>
              <div className="text-lg font-black text-white">{classes.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Giáo viên & Học sinh ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Duyệt hồ sơ Giáo viên</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Lớp học & Phân công GV ({classes.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm theo họ tên, email, mã GV hoặc mã học sinh..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value as any)}
                className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              >
                <option value="all">Tất cả nhân sự</option>
                <option value="teacher">Chỉ Giáo viên</option>
                <option value="student">Chỉ Học sinh</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Họ và tên</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Vai trò</th>
                    <th className="py-3.5 px-4">Mã cán bộ / Học sinh</th>
                    <th className="py-3.5 px-4">Tổ chuyên môn</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{m.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-500">{m.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            m.role === 'school_admin'
                              ? 'bg-amber-100 text-amber-800'
                              : m.role === 'teacher'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {m.role === 'school_admin' ? 'Ban Giám Hiệu' : m.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {m.teacherCode || m.studentCode || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{m.department || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.status === 'pending_approval'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {m.status === 'active' ? 'Đang hoạt động' : m.status === 'pending_approval' ? 'Chờ duyệt' : 'Bị khóa'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {members.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Không tìm thấy tài khoản nhân sự phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals.map((req) => {
              const isPending = req.status === 'pending';

              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl bg-white border transition-all ${
                    isPending ? 'border-amber-200 shadow-sm' : 'border-slate-200/80 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{req.teacherCode}</span>
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          {req.department}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{req.fullName}</h4>
                      <div className="text-xs text-slate-500">{req.email}</div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Đã từ chối' : 'Chờ phê duyệt'}
                    </span>
                  </div>

                  {req.proofDocumentName && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">Minh chứng: {req.proofDocumentName}</span>
                    </div>
                  )}

                  {req.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">Ghi chú: "{req.notes}"</p>
                  )}

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleRejectTeacher(req.id)}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleApproveTeacher(req.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        Phê duyệt cấp quyền
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {approvals.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs">
                Hiện không có hồ sơ giáo viên nào cần duyệt.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLASSES & TEACHER ASSIGNMENT */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {cls.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{cls.gradeLevel || 'Khối 12'}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base line-clamp-1">{cls.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{cls.subject}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Giáo viên phụ trách</div>
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>{cls.teacherName}</span>
                      <button
                        onClick={() => handleOpenAssignTeacher(cls)}
                        className="text-[11px] text-indigo-600 hover:underline font-bold"
                      >
                        Thay đổi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Sĩ số: {cls.studentCount} học sinh</span>
                    <span>Năm học: {cls.academicYear || '2026-2027'}</span>
                  </div>
                </div>
              </div>
            ))}

            {classes.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs">
                Chưa có lớp học nào thuộc trường này.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG GIÁO VIÊN */}
      <Modal
        isOpen={assignTeacherModalOpen}
        onClose={() => setAssignTeacherModalOpen(false)}
        title={`Phân công Giáo viên cho lớp: ${selectedClass?.name || ''}`}
      >
        <form onSubmit={handleAssignTeacherSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chọn Giáo viên phụ trách chính *
            </label>
            <select
              value={newTeacherId}
              onChange={(e) => setNewTeacherId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              required
            >
              <option value="">-- Chọn giáo viên trong trường --</option>
              {availableTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.teacherCode || t.email}) - {t.department || 'Tổ bộ môn'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignTeacherModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
            >
              Lưu phân công
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
