import { useState, useEffect } from 'react';
import {
  BookOpen,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  Globe,
  School as SchoolIcon,
  Edit3,
  Power
} from 'lucide-react';
import { getCurrentUser } from '../services/auth';
import {
  getSubjects,
  createSubject,
  updateSubject,
  toggleSubjectStatus
} from '../services/subjectService';
import { getSchools } from '../services/schoolService';
import type { Subject, School } from '../types';
import { Modal } from '../components/common/Modal';

export const SubjectsManagementPage = () => {
  const currentUser = getCurrentUser();
  const isSchoolAdmin = currentUser.role === 'school_admin';
  const isSystemAdmin = currentUser.role === 'system_admin';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal Thêm môn học
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGrade, setNewGrade] = useState('Toàn cấp');
  const [newSchoolId, setNewSchoolId] = useState<string>(
    isSchoolAdmin ? currentUser.schoolId || 'school-lhp' : 'global'
  );
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Sửa môn học
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editGrade, setEditGrade] = useState('Toàn cấp');
  const [editError, setEditError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const list = getSubjects({
      schoolId: isSystemAdmin ? undefined : currentUser.schoolId,
      gradeLevel: gradeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery,
    });
    setSubjects(list);
    setSchools(getSchools());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('subjects_updated', handleUpdate);
    return () => window.removeEventListener('subjects_updated', handleUpdate);
  }, [searchQuery, gradeFilter, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newCode.trim() || !newName.trim()) {
      setCreateError('Vui lòng nhập Mã môn học và Tên môn học.');
      return;
    }

    const res = createSubject({
      subjectCode: newCode.trim(),
      name: newName.trim(),
      description: newDesc.trim(),
      gradeLevel: newGrade,
      schoolId: isSchoolAdmin ? currentUser.schoolId : newSchoolId,
    });

    if (res.success) {
      setIsCreateOpen(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      showToast(`Đã thêm môn học "${res.data.name}"!`);
      loadData();
    } else {
      setCreateError(res.error.message);
    }
  };

  const handleOpenEdit = (subject: Subject) => {
    // School Admin không được sửa môn dùng chung toàn quốc (global)
    if (isSchoolAdmin && subject.schoolId === 'global') {
      alert('Môn học dùng chung toàn quốc chỉ do Quản trị viên Hệ thống (System Admin) quản lý.');
      return;
    }
    setEditingSubject(subject);
    setEditCode(subject.subjectCode);
    setEditName(subject.name);
    setEditDesc(subject.description || '');
    setEditGrade(subject.gradeLevel || 'Toàn cấp');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setEditError(null);

    const res = updateSubject(editingSubject.id, {
      subjectCode: editCode.trim(),
      name: editName.trim(),
      description: editDesc.trim(),
      gradeLevel: editGrade,
    });

    if (res.success) {
      setIsEditOpen(false);
      showToast('Cập nhật môn học thành công!');
      loadData();
    } else {
      setEditError(res.error.message);
    }
  };

  const handleToggleStatus = (subject: Subject) => {
    if (isSchoolAdmin && subject.schoolId === 'global') {
      alert('Không có quyền thay đổi trạng thái môn học dùng chung toàn quốc.');
      return;
    }
    const nextStatus = subject.status === 'active' ? 'inactive' : 'active';
    const res = toggleSubjectStatus(subject.id, nextStatus);
    if (res.success) {
      showToast(`Đã ${nextStatus === 'active' ? 'kích hoạt' : 'tắt'} môn "${subject.name}".`);
      loadData();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-700 via-amber-600 to-indigo-800 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm border border-white/20">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {isSystemAdmin
                  ? 'Quản trị Danh mục Môn học Toàn quốc & Liên trường'
                  : `Danh mục Môn học • ${currentUser.school || 'Nhà trường'}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản lý Môn học & Khối kiến thức
            </h1>
            <p className="text-white/90 text-sm max-w-2xl">
              Cung cấp danh mục môn học dùng chung toàn hệ thống kết hợp các chuyên đề chuyên sâu riêng biệt của từng trường học để giáo viên tổ chức lớp và đề thi.
            </p>
          </div>

          {(isSchoolAdmin || isSystemAdmin) && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-amber-600" />
              <span>Tạo môn học mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên môn, mã môn học, mô tả..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
          >
            <option value="all">Tất cả khối lớp</option>
            <option value="Khối 10">Khối 10</option>
            <option value="Khối 11">Khối 11</option>
            <option value="Khối 12">Khối 12</option>
            <option value="Toàn cấp">Toàn cấp</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang giảng dạy</option>
            <option value="inactive">Đã đóng/Ngừng</option>
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => {
          const isGlobal = !sub.schoolId || sub.schoolId === 'global';
          const isActive = sub.status === 'active';
          const canManage = isSystemAdmin || (isSchoolAdmin && !isGlobal);

          return (
            <div
              key={sub.id}
              className={`rounded-2xl p-5 bg-white border transition-all hover:shadow-md flex flex-col justify-between ${
                isActive ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/60 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {sub.subjectCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {sub.gradeLevel || 'Toàn cấp'}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isGlobal
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isGlobal ? <Globe className="w-3 h-3" /> : <SchoolIcon className="w-3 h-3" />}
                    {isGlobal ? 'Dùng chung toàn quốc' : 'Môn riêng của trường'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {sub.description || 'Chương trình giảng dạy môn học theo phân phối chương trình chuẩn.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                <span
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {isActive ? 'Đang mở' : 'Đã đóng'}
                </span>

                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-all"
                      title="Chỉnh sửa môn học"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(sub)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                      title={isActive ? 'Đóng môn học' : 'Kích hoạt lại'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {subjects.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-slate-200/80">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">Không tìm thấy môn học nào</h4>
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc cấp học.</p>
          </div>
        )}
      </div>

      {/* MODAL THÊM MÔN HỌC */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm Môn học Mới"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã môn học *</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="VD: SE104, TOAN-12, PHY-ADV"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp / Cấp học</label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Toàn cấp">Toàn cấp</option>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
                <option value="Đại học">Đại học</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên môn học *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="VD: Lập trình Web nâng cao & Cloud"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              required
            />
          </div>

          {isSystemAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phạm vi áp dụng</label>
              <select
                value={newSchoolId}
                onChange={(e) => setNewSchoolId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="global">Dùng chung toàn quốc (Global Standard)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    Chỉ riêng trường: {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả môn học</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              placeholder="Mô tả mục tiêu đầu ra, nội dung kiến thức cốt lõi..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-100"
            >
              Thêm môn học
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL SỬA MÔN HỌC */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Chỉnh sửa Môn: ${editingSubject?.name || ''}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã môn học *</label>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Toàn cấp">Toàn cấp</option>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
                <option value="Đại học">Đại học</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên môn học *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả môn học</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-100"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
