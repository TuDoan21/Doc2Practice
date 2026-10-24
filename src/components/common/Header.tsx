import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  Sparkles,
  CheckCircle2,
  LogOut,
  Settings,
  ChevronDown,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Modal } from './Modal';
import { PomodoroModal } from './PomodoroModal';
import { getCurrentUser, logoutUser, type UserProfile } from '../../services/auth';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const navigate = useNavigate();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Lắng nghe thay đổi tài khoản
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/quiz-sets?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setShowUserMenu(false);
    logoutUser();
    navigate('/login');
  };

  // Lấy 2 chữ cái đầu làm avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile trigger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu, bộ câu hỏi..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Pomodoro Focus Timer Button */}
        <button
          type="button"
          onClick={() => setShowPomodoro(true)}
          title="Đồng hồ tập trung Pomodoro (25 phút học / 5 phút nghỉ)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 shadow-xs transition-all hover:scale-105"
        >
          <Timer className="w-4 h-4 text-indigo-600" />
          <span className="hidden md:inline">Pomodoro</span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Thông báo mới</span>
                <span className="text-xs text-indigo-600 font-semibold cursor-pointer">Đánh dấu đã đọc</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-2">
                <div className="py-2.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Hoàn thành bài luyện tập!</p>
                    <p className="text-slate-500 mt-0.5">Bạn đạt 100% trong bộ đề Quản trị học.</p>
                    <span className="text-[10px] text-slate-400">10 phút trước</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Bộ câu hỏi sẵn sàng</p>
                    <p className="text-slate-500 mt-0.5">Tài liệu đã được tạo xong câu hỏi ôn tập.</p>
                    <span className="text-[10px] text-slate-400">1 giờ trước</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Menu người dùng"
          >
            <div className="relative">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-indigo-600 to-violet-600'} text-white font-bold text-sm flex items-center justify-center shadow-sm`}>
                {getInitials(currentUser.fullName)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.fullName}</div>
              <div className="text-[11px] text-slate-500 truncate max-w-[120px]">{currentUser.school || 'Sinh viên'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
              {/* Profile Card Header */}
              <div className="p-3 border-b border-slate-100 mb-1">
                <p className="font-bold text-sm text-slate-900 leading-tight">{currentUser.fullName}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-[10px] font-semibold text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Tài khoản chính thức</span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-1">
                <Link
                  to="/app/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Cài đặt & Tài khoản</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Xác nhận Đăng xuất */}
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
              onClick={handleConfirmLogout}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-200 transition-all"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </Modal>

      {/* Pomodoro Focus Timer Modal */}
      <PomodoroModal
        isOpen={showPomodoro}
        onClose={() => setShowPomodoro(false)}
      />
    </header>
  );
};
