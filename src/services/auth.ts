import type { UserRole } from '../types';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole; // 'student' (Học sinh/Sinh viên) | 'teacher' (Giáo viên)
  school?: string;
  avatarColor: string;
  createdAt: string;
}

const USERS_KEY = 'd2p_users_v3';
const CURRENT_USER_KEY = 'd2p_current_user_v3';

export const defaultStudent: UserProfile = {
  id: 'usr-student-01',
  fullName: 'Nguyễn Văn Học',
  email: 'vanhoc.student@uit.edu.vn',
  role: 'student',
  school: 'Đại học Công nghệ Thông tin (UIT)',
  avatarColor: 'from-indigo-600 to-violet-600',
  createdAt: '2026-10-01',
};

export const defaultTeacher: UserProfile = {
  id: 'usr-teacher-01',
  fullName: 'ThS. Trần Thị Giáo Viên',
  email: 'giaovien.tran@uit.edu.vn',
  role: 'teacher',
  school: 'Khoa Kỹ thuật Phần mềm (UIT)',
  avatarColor: 'from-emerald-600 to-teal-600',
  createdAt: '2026-10-01',
};

// Khởi tạo danh sách người dùng ban đầu
export const initAuthStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultStudent, defaultTeacher]));
  }
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultStudent));
  }
};

// Lấy user đang đăng nhập
export const getCurrentUser = (): UserProfile => {
  initAuthStorage();
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : defaultStudent;
  } catch {
    return defaultStudent;
  }
};

// Cập nhật thông tin user hiện tại
export const updateCurrentUser = (updates: Partial<UserProfile>): UserProfile => {
  const current = getCurrentUser();
  const updated: UserProfile = { ...current, ...updates };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));

  // Đồng bộ vào users list
  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [defaultStudent, defaultTeacher];
    const index = users.findIndex((u) => u.id === current.id);
    if (index >= 0) {
      users[index] = updated;
    } else {
      users.push(updated);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }

  // Bắn event để các components khác tự động cập nhật
  window.dispatchEvent(new Event('auth_state_changed'));
  return updated;
};

// Chuyển đổi nhanh vai trò người dùng (Giáo viên <-> Học sinh)
export const switchUserRole = (newRole: UserRole): UserProfile => {
  const current = getCurrentUser();
  if (current.role === newRole) return current;

  // Nếu chuyển sang role khác, có thể chuyển sang tài khoản mẫu tương ứng
  const target = newRole === 'teacher' ? defaultTeacher : defaultStudent;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(target));
  window.dispatchEvent(new Event('auth_state_changed'));
  return target;
};

// Đăng nhập
export const loginUser = (email: string, role?: UserRole): UserProfile => {
  initAuthStorage();
  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [defaultStudent, defaultTeacher];
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    const userToLogin: UserProfile = found
      ? { ...found, role: role || found.role || 'student' }
      : {
          id: `usr-${Date.now()}`,
          fullName: email.split('@')[0],
          email: email,
          role: role || (email.includes('teacher') || email.includes('giaovien') ? 'teacher' : 'student'),
          avatarColor: (role || 'student') === 'teacher' ? 'from-emerald-600 to-teal-600' : 'from-indigo-600 to-violet-600',
          createdAt: new Date().toISOString().split('T')[0],
        };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToLogin));
    window.dispatchEvent(new Event('auth_state_changed'));
    return userToLogin;
  } catch {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultStudent));
    return defaultStudent;
  }
};

// Đăng ký
export const registerUser = (fullName: string, email: string, role: UserRole = 'student'): UserProfile => {
  initAuthStorage();
  const newUser: UserProfile = {
    id: `usr-${Date.now()}`,
    fullName,
    email,
    role,
    school: role === 'teacher' ? 'Giảng viên' : 'Sinh viên',
    avatarColor: role === 'teacher' ? 'from-emerald-600 to-teal-600' : 'from-indigo-600 to-violet-600',
    createdAt: new Date().toISOString().split('T')[0],
  };

  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [defaultStudent, defaultTeacher];
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  window.dispatchEvent(new Event('auth_state_changed'));
  return newUser;
};

// Đăng xuất
export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event('auth_state_changed'));
};
