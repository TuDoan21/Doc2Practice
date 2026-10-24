import { useState, useEffect } from 'react';
import {
  School as SchoolIcon,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Power,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { getCurrentUser } from '../services/auth';
import {
  getSchools,
  createSchool,
  updateSchool,
  toggleSchoolStatus,
  getSchoolMembers
} from '../services/schoolService';
import type { School } from '../types';
import { Modal } from '../components/common/Modal';

export const SchoolsManagementPage = () => {
  const currentUser = getCurrentUser();
  const isSystemAdmin = currentUser.role === 'system_admin';

  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modal Thêm trường mới
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState<School['level']>('high_school');
  const [newAddress, setNewAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Sửa trường
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState<School['level']>('high_school');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Modal Xem chi tiết trường & nhân sự
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolMembers, setSchoolMembers] = useState<any[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const list = getSchools({ search: searchQuery, status: statusFilter });
    setSchools(list);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('schools_updated', handleUpdate);
    return () => window.removeEventListener('schools_updated', handleUpdate);
  }, [searchQuery, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newCode.trim() || !newName.trim() || !newAddress.trim() || !newEmail.trim()) {
      setCreateError('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    const res = createSchool({
      code: newCode.trim(),
      name: newName.trim(),
      level: newLevel,
      address: newAddress.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      description: newDescription.trim(),
    });

    if (res.success) {
      setIsCreateOpen(false);
      setNewCode('');
      setNewName('');
      setNewAddress('');
      setNewEmail('');
      setNewPhone('');
      setNewDescription('');
      showToast(`Đã thêm trường "${res.data.name}" vào hệ thống!`);
      loadData();
    } else {
      setCreateError(res.error.message);
    }
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setEditCode(school.code);
    setEditName(school.name);
    setEditLevel(school.level);
    setEditAddress(school.address);
    setEditEmail(school.email);
    setEditPhone(school.phone);
    setEditDescription(school.description || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    setEditError(null);

    const res = updateSchool(editingSchool.id, {
      code: editCode.trim(),
      name: editName.trim(),
      level: editLevel,
      address: editAddress.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      description: editDescription.trim(),
    });

    if (res.success) {
      setIsEditOpen(false);
      showToast('Cập nhật thông tin trường học thành công!');
      loadData();
    } else {
      setEditError(res.error.message);
    }
  };

  const handleToggleStatus = (school: School) => {
    const nextStatus = school.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = nextStatus === 'suspended'
      ? `Bạn có chắc muốn tạm ngừng trường "${school.name}"? Cán bộ và học sinh của trường sẽ tạm thời không thể tạo đề thi.`
      : `Kích hoạt lại trường "${school.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    const res = toggleSchoolStatus(school.id, nextStatus);
    if (res.success) {
      showToast(res.message || 'Cập nhật trạng thái thành công.');
      loadData();
    }
  };

  const handleViewDetail = (school: School) => {
    setSelectedSchool(school);
    const membersRes = getSchoolMembers(school.id);
    if (membersRes.success) {
      setSchoolMembers(membersRes.data);
    } else {
      setSchoolMembers([]);
    }
    setIsDetailOpen(true);
  };

  const getLevelLabel = (lvl: School['level']) => {
    switch (lvl) {
      case 'high_school':
        return 'THPT (Cấp 3)';
      case 'secondary_school':
        return 'THCS (Cấp 2)';
      case 'university':
        return 'Đại học';
      case 'college':
        return 'Cao đẳng';
      default:
        return lvl;
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
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-cyan-300 backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Thẩm quyền: Quản trị viên Hệ thống Toàn quốc (System Admin)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản lý Mạng lưới Trường học
            </h1>
            <p className="text-white/80 text-sm max-w-2xl">
              Giám sát danh mục trường học, tài khoản quản trị viên trường (School Admin), số lượng giáo viên, học sinh và quy mô khảo thí trực tuyến.
            </p>
          </div>

          {isSystemAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm trường học mới</span>
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
            placeholder="Tìm theo tên trường, mã trường, địa chỉ, email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Tạm ngừng</option>
          </select>
        </div>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schools.map((school) => {
          const isActive = school.status === 'active';

          return (
            <div
              key={school.id}
              className={`rounded-2xl p-5 bg-white border transition-all hover:shadow-md flex flex-col justify-between ${
                isActive ? 'border-slate-200/90' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <SchoolIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {school.code}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {getLevelLabel(school.level)}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug mt-1 line-clamp-1">
                        {school.name}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isActive ? 'Hoạt động' : 'Tạm ngừng'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {school.description || 'Chưa có mô tả chi tiết về trường.'}
                </p>

                {/* Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{school.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{school.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{school.phone}</span>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Giáo viên</div>
                    <div className="text-sm font-black text-slate-800">{school.teacherCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Học sinh</div>
                    <div className="text-sm font-black text-slate-800">{school.studentCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Lớp học</div>
                    <div className="text-sm font-black text-slate-800">{school.classCount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleViewDetail(school)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Chi tiết</span>
                </button>

                {isSystemAdmin && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(school)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all"
                      title="Chỉnh sửa thông tin trường"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(school)}
                      className={`p-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                      title={isActive ? 'Tạm ngừng hoạt động' : 'Kích hoạt lại'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {schools.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-slate-200/80">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">Không tìm thấy trường học nào</h4>
            <p className="text-xs text-slate-500 mt-1">
              Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc trạng thái.
            </p>
          </div>
        )}
      </div>

      {/* MODAL THÊM TRƯỜNG HỌC MỚI */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm Trường học mới vào Hệ thống"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã trường (SchoolCode) *
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="VD: LHP-HCM, CVA-HN, THPT-ABC"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cấp học / Bậc đào tạo *
              </label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="high_school">THPT (Trung học Phổ thông)</option>
                <option value="secondary_school">THCS (Trung học Cơ sở)</option>
                <option value="university">Đại học</option>
                <option value="college">Cao đẳng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên chính thức của Trường học *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="VD: THPT Chuyên Lê Hồng Phong (TP.HCM)"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Địa chỉ trụ sở trường *
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email liên hệ chính thức *
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contact@school.edu.vn"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="VD: 028 3839 8506"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả / Giới thiệu về trường
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Giới thiệu quy mô, các khoa/khối chuyên hoặc đặc thù đào tạo..."
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
            >
              Xác nhận Thêm trường
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL SỬA TRƯỜNG HỌC */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Chỉnh sửa: ${editingSchool?.name || ''}`}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã trường *</label>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cấp học *</label>
              <select
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="high_school">THPT (Trung học Phổ thông)</option>
                <option value="secondary_school">THCS (Trung học Cơ sở)</option>
                <option value="university">Đại học</option>
                <option value="college">Cao đẳng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên trường *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ *</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL XEM CHI TIẾT TRƯỜNG & NHÂN SỰ */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Hồ sơ Trường: ${selectedSchool?.name || ''}`}
      >
        {selectedSchool && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-xs">
                  {selectedSchool.code}
                </span>
                <span className="text-xs font-semibold text-indigo-900">
                  {getLevelLabel(selectedSchool.level)}
                </span>
              </div>
              <p className="text-xs text-slate-700">{selectedSchool.description || 'Không có mô tả'}</p>
              <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                <div>📍 {selectedSchool.address}</div>
                <div>📧 {selectedSchool.email} | 📞 {selectedSchool.phone}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Nhân sự trực thuộc trường ({schoolMembers.length})
                </h4>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {schoolMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{m.fullName}</div>
                      <div className="text-[11px] text-slate-400">{m.email} {m.teacherCode ? `• ${m.teacherCode}` : m.studentCode ? `• ${m.studentCode}` : ''}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      m.role === 'school_admin'
                        ? 'bg-amber-100 text-amber-800'
                        : m.role === 'teacher'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {m.role === 'school_admin' ? 'BGH' : m.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                    </span>
                  </div>
                ))}

                {schoolMembers.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có tài khoản nào được liên kết với trường này.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
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
