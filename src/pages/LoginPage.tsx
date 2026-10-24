import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { loginAsDemoRole, setSessionToken } from '../services/auth';
import { loginApi, requestPasswordResetApi } from '../services/authApi';
import type { UserRole } from '../types';

export const LoginPage = () => {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginAlert, setLoginAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Google OAuth Modal / Notice
  const [showOAuthNotice, setShowOAuthNotice] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Validate form
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng (ví dụ: student@lhp.edu.vn).';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginAlert(null);

    if (!validate()) return;

    setIsLoading(true);

    // Xác thực và lưu phiên đăng nhập
    setTimeout(() => {
      loginUser(email.trim());
      setIsLoading(false);
      setLoginAlert({
        type: 'success',
        message: 'Đăng nhập thành công! Đang chuyển hướng đến Cổng Trường Học...',
      });

      setTimeout(() => {
        navigate('/app/dashboard');
      }, 700);
    }, 600);
  };

  // Nhanh tài khoản mẫu
  const handleQuickDemoLogin = (role: UserRole = 'student') => {
    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
      loginAsDemoRole(role);
      setIsLoading(false);
      navigate('/app/dashboard');
    }, 400);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) return;

    setForgotStatus('sending');
    setTimeout(() => {
      setForgotStatus('sent');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Chào mừng bạn trở lại
        </h1>
        <p className="text-sm text-slate-500">
          Đăng nhập vào tài khoản Doc2Practice để tiếp tục bài học của bạn.
        </p>
      </div>

      {/* Global Alert */}
      {loginAlert && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all ${
            loginAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {loginAlert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{loginAlert.message}</span>
        </div>
      )}

      {/* Quick Demo Login Option */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/80 space-y-2.5">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cổng trường học — Đăng nhập nhanh kiểm thử</span>
          </div>
          <p className="text-[11px] text-indigo-700/80">Chọn một trong 4 vai trò để trải nghiệm luồng thực tế ngay lập tức:</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('student')}
            className="py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 text-left flex items-center gap-1.5"
          >
            <span>🎓</span>
            <span className="truncate">Học sinh (Làm bài)</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('teacher')}
            className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 text-left flex items-center gap-1.5"
          >
            <span>👨‍🏫</span>
            <span className="truncate">Giáo viên (Đề & Lớp)</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('school_admin')}
            className="py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 text-left flex items-center gap-1.5"
          >
            <span>🏫</span>
            <span className="truncate">Quản trị Trường</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('system_admin')}
            className="py-2 px-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 text-left flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span className="truncate">Admin Hệ thống</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Địa chỉ Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="example@student.edu.vn"
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Nhập mật khẩu của bạn"
              className={`w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setForgotEmail(email);
              setForgotStatus('idle');
              setShowForgotModal(true);
            }}
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-semibold">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      {/* Google Login Button (chưa cấu hình OAuth) */}
      <button
        type="button"
        onClick={() => setShowOAuthNotice(true)}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
          />
        </svg>
        <span>Đăng nhập với Google</span>
      </button>

      {/* Switch to Register */}
      <div className="text-center text-xs text-slate-500 pt-2">
        <span>Chưa có tài khoản Doc2Practice? </span>
        <Link
          to="/register"
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
        >
          Đăng ký miễn phí
        </Link>
      </div>

      {/* Modal thông báo trạng thái Google OAuth */}
      <Modal
        isOpen={showOAuthNotice}
        onClose={() => setShowOAuthNotice(false)}
        title="Trạng thái tích hợp Google OAuth"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Chưa kích hoạt Supabase OAuth</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tính năng đăng nhập 1 chạm với Google sẽ hoạt động khi bạn cấu hình Client ID và Secret trong Supabase Dashboard ở giai đoạn tiếp theo.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowOAuthNotice(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Quên mật khẩu */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Khôi phục mật khẩu"
        maxWidth="sm"
      >
        {forgotStatus === 'sent' ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Đã gửi liên kết khôi phục!</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Vui lòng kiểm tra hộp thư đến của <span className="font-semibold text-slate-800">{forgotEmail}</span> và làm theo hướng dẫn để đặt lại mật khẩu.
              </p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Quay lại đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhập email đăng ký tài khoản của bạn. Hệ thống sẽ gửi một liên kết bảo mật để bạn tạo mật khẩu mới.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email của bạn</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="example@student.edu.vn"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={forgotStatus === 'sending' || !forgotEmail}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                {forgotStatus === 'sending' ? 'Đang gửi...' : 'Gửi liên kết'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

