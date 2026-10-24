import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestPasswordResetApi } from '../services/authApi';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await requestPasswordResetApi(email.trim());
    setIsLoading(false);

    if (res.success) {
      setSuccessToken(res.data.resetToken);
    } else {
      setErrorMessage(res.error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Khôi phục mật khẩu
        </h1>
        <p className="text-sm text-slate-500">
          Nhập địa chỉ email trường học hoặc email bạn đã dùng để đăng ký tài khoản.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successToken ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base">Đã tạo liên kết khôi phục an toàn</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mã bảo mật có hiệu lực trong vòng 15 phút. Trong môi trường thử nghiệm, bạn có thể bấm trực tiếp vào nút dưới đây để tạo mật khẩu mới:
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={`/reset-password?token=${encodeURIComponent(successToken)}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102"
            >
              <span>Tiếp tục Đặt lại Mật khẩu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-emerald-200/60 pt-3">
            Mã Token: <code className="font-mono font-bold text-emerald-800">{successToken}</code>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@student.edu.vn"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Gửi liên kết khôi phục</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
};
