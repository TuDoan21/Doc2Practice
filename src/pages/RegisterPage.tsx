import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const RegisterPage = () => {
  const navigate = useNavigate();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Errors & Alerts
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});
  const [registerAlert, setRegisterAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Terms Modal & Google Notice
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showOAuthNotice, setShowOAuthNotice] = useState(false);

  // Password strength logic
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  let strengthScore = 0;
  if (hasMinLength) strengthScore += 1;
  if (hasMixedCase) strengthScore += 1;
  if (hasNumber) strengthScore += 1;

  const getStrengthLabel = () => {
    if (!password) return { text: 'Chưa nhập', color: 'bg-slate-200', textCol: 'text-slate-400' };
    if (strengthScore === 1) return { text: 'Yếu', color: 'bg-rose-500', textCol: 'text-rose-600' };
    if (strengthScore === 2) return { text: 'Trung bình', color: 'bg-amber-500', textCol: 'text-amber-600' };
    return { text: 'Mạnh', color: 'bg-emerald-500', textCol: 'text-emerald-600' };
  };

  const strength = getStrengthLabel();

  // Validate form
  const validate = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên của bạn.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên tối thiểu 2 ký tự.';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng (ví dụ: student@gmail.com).';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có tối thiểu 8 ký tự.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterAlert(null);

    if (!validate()) return;

    setIsLoading(true);

    // Mô phỏng quá trình tạo tài khoản
    setTimeout(() => {
      setIsLoading(false);
      setRegisterAlert({
        type: 'success',
        message: 'Tạo tài khoản thành công! Đang chuyển đến Bảng điều khiển...',
      });

      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1000);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Tạo tài khoản miễn phí
        </h1>
        <p className="text-sm text-slate-500">
          Tham gia Doc2Practice để biến tài liệu học tập thành bài luyện thi thông minh.
        </p>
      </div>

      {/* Global Alert */}
      {registerAlert && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all ${
            registerAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {registerAlert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{registerAlert.message}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Họ và tên
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Nguyễn Văn Học"
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${
                errors.fullName
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        {/* Email */}
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

        {/* Password */}
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
              placeholder="Tối thiểu 8 ký tự"
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

          {/* Password strength meter */}
          {password && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Độ mạnh mật khẩu:</span>
                <span className={`font-bold text-[11px] ${strength.textCol}`}>{strength.text}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                <div className={`h-full rounded-full transition-all ${strengthScore >= 1 ? strength.color : 'bg-slate-200'}`} />
                <div className={`h-full rounded-full transition-all ${strengthScore >= 2 ? strength.color : 'bg-slate-200'}`} />
                <div className={`h-full rounded-full transition-all ${strengthScore >= 3 ? strength.color : 'bg-slate-200'}`} />
              </div>

              {/* Requirements checklist */}
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 pt-1">
                <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-semibold' : ''}`}>
                  <Check className={`w-3 h-3 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Ít nhất 8 ký tự</span>
                </div>
                <div className={`flex items-center gap-1 ${hasMixedCase ? 'text-emerald-600 font-semibold' : ''}`}>
                  <Check className={`w-3 h-3 ${hasMixedCase ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Chữ hoa & chữ thường</span>
                </div>
                <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-semibold' : ''}`}>
                  <Check className={`w-3 h-3 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Chứa ít nhất 1 số</span>
                </div>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Nhập lại mật khẩu"
              className={`w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${
                errors.confirmPassword
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.confirmPassword}</span>
            </p>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none leading-relaxed">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: undefined }));
              }}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
            />
            <span>
              Tôi đồng ý với{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowTermsModal(true);
                }}
                className="font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                Điều khoản sử dụng
              </button>{' '}
              và{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowTermsModal(true);
                }}
                className="font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                Chính sách bảo mật
              </button>
              .
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.agreeTerms}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !agreeTerms}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <span>Tạo tài khoản miễn phí</span>
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
            Hoặc đăng ký nhanh với
          </span>
        </div>
      </div>

      {/* Google OAuth Button */}
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
        <span>Đăng ký với Google</span>
      </button>

      {/* Switch to Login */}
      <div className="text-center text-xs text-slate-500 pt-2">
        <span>Đã có tài khoản? </span>
        <Link
          to="/login"
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>

      {/* Modal Điều khoản sử dụng */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Điều khoản sử dụng & Quyền riêng tư"
        maxWidth="md"
      >
        <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="font-semibold">Doc2Practice cam kết bảo mật tuyệt đối tài liệu học tập của bạn.</span>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-1">1. Mục đích sử dụng</h5>
            <p>
              Nền tảng Doc2Practice phục vụ mục đích học tập cá nhân, nghiên cứu và tự ôn thi. Tài liệu bạn tải lên chỉ được xử lý để sinh câu hỏi và flashcard cho chính bạn.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-1">2. Bảo vệ bản quyền</h5>
            <p>
              Người dùng chịu trách nhiệm về quyền sở hữu hoặc quyền sử dụng hợp pháp đối với các tệp PDF, Word (.docx) và Slide (.pptx) tải lên hệ thống.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-1">3. Lưu trữ và Bảo mật</h5>
            <p>
              Ở phiên bản hiện tại, dữ liệu ôn tập được lưu cục bộ trên trình duyệt của bạn (LocalStorage) và không chia sẻ cho bên thứ ba.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setAgreeTerms(true);
                setShowTermsModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
            >
              Tôi đồng ý và tiếp tục
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Google OAuth Notice */}
      <Modal
        isOpen={showOAuthNotice}
        onClose={() => setShowOAuthNotice(false)}
        title="Đăng ký tài khoản với Google"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Chưa kích hoạt Supabase OAuth</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tính năng đăng ký liên kết tài khoản Google sẽ sẵn sàng khi tích hợp Supabase Auth. Bạn có thể đăng ký tài khoản nhanh bằng biểu mẫu trên!
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
    </div>
  );
};

