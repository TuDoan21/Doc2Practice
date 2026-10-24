import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth';
import type { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const location = useLocation();
  const currentUser = getCurrentUser();

  // 1. Kiểm tra xác thực (Chưa đăng nhập)
  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 2. Kiểm tra tài khoản giáo viên đang chờ phê duyệt
  if (currentUser.role === 'teacher' && currentUser.status === 'pending_approval') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Hồ Sơ Sư Phạm Đang Chờ Duyệt</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hồ sơ đăng ký tài khoản Giáo viên của bạn tại <strong>{currentUser.school || 'nhà trường'}</strong> hiện đang được Ban Giám Hiệu thẩm định danh tính. Bạn sẽ nhận được thông báo khi hồ sơ được kích hoạt.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về màn hình đăng nhập</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Kiểm tra phân quyền vai trò (Role-Based Authorization)
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-200 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Quyền Truy Cập Bị Từ Chối</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Khu vực này yêu cầu thẩm quyền dành riêng cho: <strong>{allowedRoles.join(', ')}</strong>. Vai trò hiện tại của bạn là <strong>{currentUser.role}</strong>.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.location.href = '/app/dashboard'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Bảng điều khiển của bạn</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

