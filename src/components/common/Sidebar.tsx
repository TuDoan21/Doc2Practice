import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  Layers,
  History,
  Settings,
  PlusCircle,
  BookOpen,
  ExternalLink,
  LogOut,
  AlertTriangle,
  Users,
  School
} from 'lucide-react';
import { Modal } from './Modal';
import { getCurrentUser, type UserProfile } from '../../services/auth';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());

  useEffect(() => {
    const handleAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth_state_changed', handleAuth);
    return () => window.removeEventListener('auth_state_changed', handleAuth);
  }, []);

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case 'teacher':
        return { name: '👨‍🏫 Giáo viên', color: 'bg-emerald-100 text-emerald-800', desc: 'Có quyền tạo lớp, giao bài kiểm tra khóa tab và xem điểm học sinh.' };
      case 'school_admin':
        return { name: '🏫 Ban Giám Hiệu', color: 'bg-amber-100 text-amber-800', desc: 'Phê duyệt hồ sơ giáo viên, quản lý lớp học và khảo thí toàn trường.' };
      case 'system_admin':
        return { name: '⚙️ Quản trị HT', color: 'bg-purple-100 text-purple-800', desc: 'Quản trị hệ thống toàn quốc, đối tác trường học và giám sát hạ tầng.' };
      default:
        return { name: '🎓 Học sinh', color: 'bg-indigo-100 text-indigo-800', desc: 'Tham gia lớp của giáo viên và tự tải tài liệu để ôn tập.' };
    }
  };

  const roleInfo = getRoleLabel();

  const getNavItems = () => {
    const items = [
      { label: 'Tổng quan', path: '/app/dashboard', icon: LayoutDashboard },
    ];

    if (currentUser.role === 'system_admin') {
      items.push({ label: 'Quản lý Trường học', path: '/app/schools', icon: School });
      items.push({ label: 'Quản lý Môn học', path: '/app/subjects', icon: BookOpen });
      items.push({ label: 'Toàn bộ Lớp học', path: '/app/classes', icon: Users });
    } else if (currentUser.role === 'school_admin') {
      items.push({ label: 'Trường & Nhân sự', path: '/app/school-admin', icon: School });
      items.push({ label: 'Quản lý Môn học', path: '/app/subjects', icon: BookOpen });
      items.push({ label: 'Lớp học & Phân công', path: '/app/classes', icon: Users });
    } else if (currentUser.role === 'teacher') {
      items.push({ label: 'Quản lý Lớp học', path: '/app/classes', icon: Users });
    } else {
      items.push({ label: 'Lớp học của tôi', path: '/app/classes', icon: Users });
    }

    items.push(
      { label: 'Tài liệu của tôi', path: '/app/documents', icon: FileText },
      { label: 'Bộ câu hỏi', path: '/app/quiz-sets', icon: HelpCircle },
      { label: 'Flashcard ghi nhớ', path: '/app/flashcards', icon: Layers },
      { label: 'Lịch sử luyện tập', path: '/app/history', icon: History },
      { label: 'Cài đặt', path: '/app/settings', icon: Settings }
    );

    return items;
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    setShowLogoutModal(false);
    if (onCloseMobile) onCloseMobile();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
              Doc<span className="text-indigo-600">2</span>Practice
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Bản dùng thử MVP</div>
          </div>
        </div>

        {/* Action Button: Tạo bộ câu hỏi */}
        <div className="p-4">
          <NavLink
            to="/app/create-quiz"
            onClick={onCloseMobile}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all transform active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo bộ câu hỏi mới</span>
          </NavLink>
        </div>

        {/* Navigation links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info / Hint & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Vai trò:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleInfo.color}`}>
              {roleInfo.name}
            </span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            {roleInfo.desc}
          </p>
        </div>

        <div className="space-y-1 pt-1">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center justify-between text-xs text-slate-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span>Về trang giới thiệu</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </NavLink>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-between text-xs text-rose-600 hover:text-rose-700 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors font-semibold"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </span>
          </button>
        </div>
      </div>

      {/* Modal xác nhận đăng xuất */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Xác nhận đăng xuất"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Bạn muốn rời khỏi phiên học tập?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tiến độ luyện tập và dữ liệu của bạn đã được tự động lưu an toàn trên trình duyệt.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Ở lại
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-200 transition-all"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
};
