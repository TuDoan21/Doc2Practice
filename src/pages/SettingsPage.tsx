import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Database,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  LogOut
} from 'lucide-react';
import { initStorage } from '../services/storage';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saveKeySuccess, setSaveKeySuccess] = useState(false);

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả dữ liệu về mặc định ban đầu không?')) {
      localStorage.clear();
      initStorage();
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?')) {
      navigate('/login');
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveKeySuccess(true);
    setTimeout(() => setSaveKeySuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý tài khoản, cấu hình trải nghiệm học tập và dữ liệu lưu trữ.
        </p>
      </div>

      {/* User Profile Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          <span>Thông tin người dùng demo</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
              VH
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Nguyễn Văn Học</h3>
              <p className="text-xs text-slate-500">vanhoc.student@uit.edu.vn • Tài khoản dùng thử</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>

      {/* Backend & AI Integration Roadmap */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Tích hợp AI & Cơ sở dữ liệu (Giai đoạn tiếp theo)</span>
          </h2>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Ready to Connect
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Hiện tại Doc2Practice đang hoạt động bằng LocalStorage và thuật toán mô phỏng. Khi bạn sẵn sàng triển khai thực tế, bạn chỉ cần liên kết với Supabase Backend và Gemini API.
        </p>

        <form onSubmit={handleSaveApiKey} className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-700 block">
            Google Gemini API Key (Tùy chọn cho chế độ Developer)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Nhập AIzaSy... (Chưa bắt buộc trong bản demo)"
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
            >
              Lưu khóa
            </button>
          </div>
          {saveKeySuccess && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã lưu thành công cho phiên làm việc hiện tại.</span>
            </p>
          )}
        </form>
      </div>

      {/* Storage Reset Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <span>Dữ liệu trình duyệt</span>
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Khôi phục tất cả tài liệu, bộ câu hỏi mẫu, flashcard và lịch sử luyện tập về trạng thái ban đầu của hệ thống.
        </p>

        <button
          onClick={handleResetData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt lại toàn bộ dữ liệu mẫu</span>
        </button>

        {resetSuccess && (
          <p className="text-xs text-emerald-600 font-semibold">
            Đã khôi phục thành công! Đang làm mới trang...
          </p>
        )}
      </div>
    </div>
  );
};

