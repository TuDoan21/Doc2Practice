import type { UserRole, TeacherApprovalRequest } from '../types';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  school?: string;
  department?: string; // Tổ chuyên môn (VD: Toán - Tin, Ngữ Văn...)
  studentCode?: string; // Mã học sinh
  teacherCode?: string; // Mã giáo viên / Cán bộ
  avatarColor: string;
  createdAt: string;
  status?: 'active' | 'pending_approval';
}

const USERS_KEY = 'd2p_users_v4';
const CURRENT_USER_KEY = 'd2p_current_user_v4';
const TEACHER_APPROVALS_KEY = 'd2p_teacher_approvals_v1';

export const defaultStudent: UserProfile = {
  id: 'usr-student-01',
  fullName: 'Nguyễn Văn Học',
  email: 'vanhoc.student@lhp.edu.vn',
  role: 'student',
  school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
  studentCode: 'HS-2026-12A1',
  avatarColor: 'from-indigo-600 to-violet-600',
  createdAt: '2026-09-05',
  status: 'active',
};

export const defaultTeacher: UserProfile = {
  id: 'usr-teacher-01',
  fullName: 'ThS. Trần Thị Giáo Viên',
  email: 'giaovien.tran@lhp.edu.vn',
  role: 'teacher',
  school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
  department: 'Tổ Toán - Tin học',
  teacherCode: 'GV-TOAN-014',
  avatarColor: 'from-emerald-600 to-teal-600',
  createdAt: '2026-08-15',
  status: 'active',
};

export const defaultSchoolAdmin: UserProfile = {
  id: 'usr-admin-01',
  fullName: 'TS. Lê Văn Quản Trị',
  email: 'hieutruong.le@lhp.edu.vn',
  role: 'school_admin',
  school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
  department: 'Ban Giám Hiệu & Quản Trị',
  teacherCode: 'BGH-LHP-01',
  avatarColor: 'from-amber-600 to-orange-600',
  createdAt: '2026-08-01',
  status: 'active',
};

export const defaultSystemAdmin: UserProfile = {
  id: 'usr-sysadmin-01',
  fullName: 'Quản Trị Viên Hệ Thống',
  email: 'sysadmin@doc2practice.edu.vn',
  role: 'system_admin',
  school: 'Doc2Practice National Network',
  avatarColor: 'from-purple-700 to-indigo-900',
  createdAt: '2026-01-01',
  status: 'active',
};

// Dữ liệu mẫu hồ sơ giáo viên đang chờ Ban Giám hiệu duyệt
export const initialTeacherApprovals: TeacherApprovalRequest[] = [
  {
    id: 'req-01',
    fullName: 'Thầy Nguyễn Hữu Trí',
    email: 'huutri.nguyen@lhp.edu.vn',
    schoolName: 'THPT Chuyên Lê Hồng Phong',
    department: 'Tổ Vật Lý',
    teacherCode: 'GV-LY-008',
    proofDocumentName: 'Quyet_dinh_phan_cong_giang_day_2026.pdf',
    status: 'pending',
    submittedAt: 'Hôm nay 08:30',
    notes: 'Giáo viên thỉnh giảng bồi dưỡng học sinh giỏi môn Vật lý 12',
  },
  {
    id: 'req-02',
    fullName: 'Cô Đặng Thu Hà',
    email: 'thuha.dang@lhp.edu.vn',
    schoolName: 'THPT Chuyên Lê Hồng Phong',
    department: 'Tổ Ngữ Văn',
    teacherCode: 'GV-VAN-021',
    proofDocumentName: 'The_can_bo_vien_chuc_HaDT.jpg',
    status: 'pending',
    submittedAt: 'Hôm qua 15:10',
    notes: 'Giáo viên phụ trách khối 10 và 11',
  },
  {
    id: 'req-03',
    fullName: 'Thầy Phạm Quốc Hùng',
    email: 'quochung.pham@lhp.edu.vn',
    schoolName: 'THPT Chuyên Lê Hồng Phong',
    department: 'Tổ Tiếng Anh',
    teacherCode: 'GV-ENG-005',
    proofDocumentName: 'Hop_dong_giang_day_2026.pdf',
    status: 'approved',
    submittedAt: '23/10/2026',
    notes: 'Đã xác minh và cấp quyền tạo lớp học',
  },
];

// Khởi tạo danh sách người dùng ban đầu
export const initAuthStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([defaultStudent, defaultTeacher, defaultSchoolAdmin, defaultSystemAdmin])
    );
  }
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultStudent));
  }
  if (!localStorage.getItem(TEACHER_APPROVALS_KEY)) {
    localStorage.setItem(TEACHER_APPROVALS_KEY, JSON.stringify(initialTeacherApprovals));
  }
};

// Lấy danh sách hồ sơ giáo viên chờ duyệt
export const getTeacherApprovalRequests = (): TeacherApprovalRequest[] => {
  initAuthStorage();
  try {
    const raw = localStorage.getItem(TEACHER_APPROVALS_KEY);
    return raw ? JSON.parse(raw) : initialTeacherApprovals;
  } catch {
    return initialTeacherApprovals;
  }
};

// Gửi yêu cầu đăng ký giáo viên (Chờ phê duyệt)
export const submitTeacherApprovalRequest = (params: {
  fullName: string;
  email: string;
  schoolName: string;
  department: string;
  teacherCode: string;
  proofDocumentName?: string;
  notes?: string;
}): TeacherApprovalRequest => {
  const list = getTeacherApprovalRequests();
  const newRequest: TeacherApprovalRequest = {
    id: `req-${Date.now()}`,
    fullName: params.fullName,
    email: params.email,
    schoolName: params.schoolName,
    department: params.department,
    teacherCode: params.teacherCode,
    proofDocumentName: params.proofDocumentName || 'Ho_so_minh_chung_su_pham.pdf',
    status: 'pending',
    submittedAt: 'Vừa xong',
    notes: params.notes || 'Đăng ký tài khoản giáo viên mới qua cổng trường học',
  };

  list.unshift(newRequest);
  localStorage.setItem(TEACHER_APPROVALS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('teacher_approvals_updated'));
  return newRequest;
};

// Phê duyệt hoặc từ chối hồ sơ giáo viên (Dành cho School Admin)
export const updateTeacherApprovalStatus = (
  requestId: string,
  newStatus: 'approved' | 'rejected'
): void => {
  const list = getTeacherApprovalRequests();
  const found = list.find((r) => r.id === requestId);
  if (found) {
    found.status = newStatus;
    localStorage.setItem(TEACHER_APPROVALS_KEY, JSON.stringify(list));

    // Nếu duyệt, thêm tài khoản vào danh sách users
    if (newStatus === 'approved') {
      try {
        const rawUsers = localStorage.getItem(USERS_KEY);
        const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];
        const exists = users.find((u) => u.email === found.email);
        if (!exists) {
          users.push({
            id: `usr-teacher-${Date.now()}`,
            fullName: found.fullName,
            email: found.email,
            role: 'teacher',
            school: found.schoolName,
            department: found.department,
            teacherCode: found.teacherCode,
            avatarColor: 'from-emerald-600 to-teal-600',
            createdAt: new Date().toISOString().split('T')[0],
            status: 'active',
          });
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      } catch {
        // ignore
      }
    }

    window.dispatchEvent(new Event('teacher_approvals_updated'));
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
    const users: UserProfile[] = rawUsers
      ? JSON.parse(rawUsers)
      : [defaultStudent, defaultTeacher, defaultSchoolAdmin, defaultSystemAdmin];
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

  window.dispatchEvent(new Event('auth_state_changed'));
  return updated;
};

// Đăng nhập nhanh bằng vai trò mẫu (Demo helper cho ban giám hiệu & giáo viên)
export const loginAsDemoRole = (role: UserRole): UserProfile => {
  let target: UserProfile = defaultStudent;
  if (role === 'teacher') target = defaultTeacher;
  else if (role === 'school_admin') target = defaultSchoolAdmin;
  else if (role === 'system_admin') target = defaultSystemAdmin;

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(target));
  window.dispatchEvent(new Event('auth_state_changed'));
  return target;
};

// Đăng nhập
export const loginUser = (email: string, role?: UserRole): UserProfile => {
  initAuthStorage();
  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = rawUsers
      ? JSON.parse(rawUsers)
      : [defaultStudent, defaultTeacher, defaultSchoolAdmin, defaultSystemAdmin];
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    const userToLogin: UserProfile = found
      ? { ...found, role: role || found.role || 'student' }
      : {
          id: `usr-${Date.now()}`,
          fullName: email.split('@')[0],
          email: email,
          role: role || (email.includes('teacher') ? 'teacher' : 'student'),
          school: 'Trường học liên kết Doc2Practice',
          avatarColor:
            (role || 'student') === 'teacher'
              ? 'from-emerald-600 to-teal-600'
              : (role || 'student') === 'school_admin'
              ? 'from-amber-600 to-orange-600'
              : 'from-indigo-600 to-violet-600',
          createdAt: new Date().toISOString().split('T')[0],
          status: 'active',
        };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToLogin));
    window.dispatchEvent(new Event('auth_state_changed'));
    return userToLogin;
  } catch {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultStudent));
    return defaultStudent;
  }
};

// Đăng ký học sinh (Kích hoạt ngay)
export const registerStudent = (params: {
  fullName: string;
  email: string;
  school: string;
  studentCode?: string;
}): UserProfile => {
  initAuthStorage();
  const newUser: UserProfile = {
    id: `usr-std-${Date.now()}`,
    fullName: params.fullName,
    email: params.email,
    role: 'student',
    school: params.school || 'THPT Chuyên Lê Hồng Phong',
    studentCode: params.studentCode || `HS-${Math.floor(1000 + Math.random() * 9000)}`,
    avatarColor: 'from-indigo-600 to-violet-600',
    createdAt: new Date().toISOString().split('T')[0],
    status: 'active',
  };

  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = rawUsers
      ? JSON.parse(rawUsers)
      : [defaultStudent, defaultTeacher, defaultSchoolAdmin, defaultSystemAdmin];
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
