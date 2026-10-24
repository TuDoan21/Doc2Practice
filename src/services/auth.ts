export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  school?: string;
  avatarColor: string;
  createdAt: string;
}

const USERS_KEY = 'd2p_users_v2';
const CURRENT_USER_KEY = 'd2p_current_user_v2';

export const defaultUser: UserProfile = {
  id: 'usr-default',
  fullName: 'Nguyễn Văn Học',
  email: 'vanhoc.student@uit.edu.vn',
  school: 'Đại học Công nghệ Thông tin (UIT)',
  avatarColor: 'from-indigo-600 to-violet-600',
  createdAt: '2026-10-01',
};

// Khởi tạo danh sách người dùng ban đầu
export const initAuthStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
  }
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
  }
};

// Lấy user đang đăng nhập
export const getCurrentUser = (): UserProfile => {
  initAuthStorage();
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : defaultUser;
  } catch {
    return defaultUser;
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
    const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [defaultUser];
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

// Đăng nhập
export const loginUser = (email: string): UserProfile => {
  initAuthStorage();
  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [defaultUser];
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    const userToLogin = found || {
      id: `usr-${Date.now()}`,
      fullName: email.split('@')[0],
      email: email,
      avatarColor: 'from-indigo-600 to-violet-600',
      createdAt: new Date().toISOString().split('T')[0],
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToLogin));
    window.dispatchEvent(new Event('auth_state_changed'));
    return userToLogin;
  } catch {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  }
};

// Đăng ký
export const registerUser = (fullName: string, email: string): UserProfile => {
  initAuthStorage();
  const newUser: UserProfile = {
    id: `usr-${Date.now()}`,
    fullName,
    email,
    school: 'Sinh viên',
    avatarColor: 'from-violet-600 to-indigo-600',
    createdAt: new Date().toISOString().split('T')[0],
  };

  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [defaultUser];
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
