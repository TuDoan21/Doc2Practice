import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Database,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  LogOut,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';
import { initStorage, getStats } from '../services/storage';
import { getCurrentUser, updateCurrentUser, logoutUser, type UserProfile } from '../services/auth';
import { getStoredApiKey, saveStoredApiKey, testGeminiApiKey } from '../services/aiService';

export const SettingsPage = () => {
  const navigate = useNavigate();

  // Profile states
  const [user, setUser] = useState<UserProfile>(getCurrentUser());
  const [fullName, setFullName] = useState(user.fullName);
  const [school, setSchool] = useState(user.school || '');
  const [department, setDepartment] = useState(user.department || '');
  const [code, setCode] = useState(user.teacherCode || user.studentCode || '');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || 'from-indigo-600 to-violet-600');
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // Gemini API Key states
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [testResult, setTestResult] = useState<{ loading: boolean; valid?: boolean; message?: string }>({
    loading: false,
  });
  const [saveKeySuccess, setSaveKeySuccess] = useState(false);

  // Reset state
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    setFullName(cur.fullName);
    setSchool(cur.school || '');
    setDepartment(cur.department || '');
    setCode(cur.teacherCode || cur.studentCode || '');
    setAvatarColor(cur.avatarColor || 'from-indigo-600 to-violet-600');
    setApiKey(getStoredApiKey());
  }, []);

  // Lưu thông tin hồ sơ
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateCurrentUser({
      fullName: fullName.trim(),
      school: school.trim(),
      department: department.trim(),
      teacherCode: user.role === 'teacher' ? code.trim() : undefined,
      studentCode: user.role === 'student' ? code.trim() : undefined,
      avatarColor,
    });
    setUser(updated);
    setSaveProfileSuccess(true);
    setTimeout(() => setSaveProfileSuccess(false), 2500);
  };

  // Test kết nối Gemini API
  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ loading: false, valid: false, message: 'Vui lòng nhập API Key để kiểm tra.' });
      return;
    }

    setTestResult({ loading: true });
    const res = await testGeminiApiKey(apiKey);
    setTestResult({ loading: false, valid: res.valid, message: res.message });
  };

  // Lưu API Key
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredApiKey(apiKey);
    setSaveKeySuccess(true);
    setTimeout(() => setSaveKeySuccess(false), 2500);
  };

  // Xóa API Key
  const handleRemoveApiKey = () => {
    saveStoredApiKey('');
    setApiKey('');
    setTestResult({ loading: false });
  };

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
      logoutUser();
      navigate('/login');
    }
  };

  // Tùy chọn màu avatar
  const avatarColors = [
    { label: 'Tím Indigo', value: 'from-indigo-600 to-violet-600' },
    { label: 'Xanh Biển', value: 'from-blue-600 to-cyan-600' },
    { label: 'Ngọc Lục Bảo', value: 'from-emerald-600 to-teal-600' },
    { label: 'Cam Hồng', value: 'from-rose-500 to-amber-500' },
    { label: 'Tím Đậm', value: 'from-purple-700 to-pink-600' },
  ];

  const stats = getStats();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý tài khoản, cấu hình kết nối Google Gemini AI và dữ liệu lưu trữ.
        </p>
      </div>

      {/* 1. User Profile Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <span>Hồ sơ người dùng</span>
          </h2>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${avatarColor} text-white font-bold text-lg flex items-center justify-center shadow-md shrink-0`}>
              {fullName ? fullName.slice(0, 2).toUpperCase() : 'VH'}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Màu sắc ảnh đại diện:</label>
              <div className="flex items-center gap-2">
                {avatarColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAvatarColor(c.value)}
                    className={`w-6 h-6 rounded-full bg-gradient-to-tr ${c.value} transition-transform ${
                      avatarColor === c.value ? 'scale-125 ring-2 ring-indigo-600 ring-offset-2' : 'hover:scale-110'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Họ và tên</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email tài khoản</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Trường học / Đơn vị đào tạo</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="VD: THPT Chuyên Lê Hồng Phong"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {user.role === 'teacher' ? 'Tổ / Bộ môn chuyên môn' : 'Khối lớp / Ngành học'}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="VD: Tổ Toán - Tin học hoặc Lớp 12A1"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {user.role === 'teacher' ? 'Mã cán bộ / Giáo viên' : 'Mã số học sinh / sinh viên'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: GV-TOAN-014 hoặc HS-2026-0812"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Vai trò & Quyền hạn</label>
              <div className="px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                <span>
                  {user.role === 'teacher'
                    ? '👨‍🏫 Giáo viên / Giảng viên'
                    : user.role === 'school_admin'
                    ? '🏫 Ban Giám Hiệu'
                    : user.role === 'system_admin'
                    ? '⚙️ Quản trị Toàn hệ thống'
                    : '🎓 Học sinh / Sinh viên'}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  ✓ Đã kích hoạt
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveProfileSuccess ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Đã lưu thông tin hồ sơ thành công!</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Lưu hồ sơ
            </button>
          </div>
        </form>
      </div>

      {/* 2. Google Gemini API Integration Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Tích hợp Google Gemini AI</span>
          </h2>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            apiKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}>
            {apiKey ? 'Đã cài đặt API Key' : 'Chưa nhập Key (Dùng Engine nội bộ)'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Doc2Practice hỗ trợ kết nối trực tiếp với <b>Google Gemini 1.5 Flash</b> qua mô hình BYOK (Bring Your Own Key). Khi có Key, hệ thống sẽ phân tích văn bản thực tế để sinh câu hỏi trắc nghiệm chất lượng cao và thẻ flashcard tự động.
        </p>

        <form onSubmit={handleSaveApiKey} className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-700 block">
            Google Gemini API Key
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult({ loading: false });
              }}
              placeholder="Nhập khóa API (bắt đầu bằng AIzaSy...)"
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testResult.loading || !apiKey.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold transition-colors shrink-0"
              >
                {testResult.loading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shrink-0"
              >
                Lưu Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemoveApiKey}
                  className="px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold shrink-0"
                  title="Xóa Key"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Test connection alert */}
          {testResult.message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
              testResult.valid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {testResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {saveKeySuccess && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã lưu API Key thành công cho các lần tạo câu hỏi tiếp theo!</span>
            </p>
          )}

          <div className="pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              <span>Lấy Google Gemini API Key miễn phí tại Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </form>
      </div>

      {/* 3. Storage & Data Management Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <span>Dữ liệu và Bộ nhớ trình duyệt</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Tài liệu đã lưu:</span>
            <span className="font-extrabold text-base text-slate-800">{stats.totalDocuments}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Bộ câu hỏi:</span>
            <span className="font-extrabold text-base text-slate-800">{stats.totalQuizSets}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Câu đã làm:</span>
            <span className="font-extrabold text-base text-slate-800">{stats.totalQuestionsAnswered}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Điểm trung bình:</span>
            <span className="font-extrabold text-base text-emerald-600">{stats.averageScore}%</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Tất cả dữ liệu đề thi, thẻ ghi nhớ và lịch sử điểm số đều được lưu trữ trực tiếp trên thiết bị của bạn. Bạn có thể khôi phục về trạng thái ban đầu bất cứ lúc nào.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đặt lại toàn bộ dữ liệu mẫu</span>
          </button>
        </div>

        {resetSuccess && (
          <p className="text-xs text-emerald-600 font-semibold">
            Đã khôi phục thành công! Đang làm mới hệ thống...
          </p>
        )}
      </div>
    </div>
  );
};
