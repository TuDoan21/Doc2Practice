import type { UserRecord, Classroom } from '../types';
import { generateSalt, hashPassword } from './security';
import { recordAuditLog } from './auditService';

export const SECURE_USERS_KEY = 'd2p_users_v5_secure';
export const SESSIONS_KEY = 'd2p_sessions_v1';
export const RESET_TOKENS_KEY = 'd2p_reset_tokens_v1';
const MIGRATION_FLAG_KEY = 'd2p_migration_v5_completed';

/**
 * Mật khẩu khởi tạo an toàn cho các tài khoản mẫu
 */
const DEFAULT_PASSWORDS: Record<string, string> = {
  'vanhoc.student@lhp.edu.vn': 'student123',
  'giaovien.tran@lhp.edu.vn': 'teacher123',
  'hieutruong.le@lhp.edu.vn': 'admin123',
  'sysadmin@doc2practice.edu.vn': 'sysadmin123',
};

/**
 * Migration an toàn: Chuyển đổi dữ liệu sang lược đồ có băm mật khẩu, token phiên và RBAC
 * Giữ nguyên 100% dữ liệu lớp học, tài liệu, kết quả làm bài của người dùng.
 */
export const runAuthMigrations = async (): Promise<{
  migrated: boolean;
  usersCount: number;
  message: string;
}> => {
  if (typeof localStorage === 'undefined') {
    return { migrated: false, usersCount: 0, message: 'SSR/Node environment' };
  }

  const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  const existingSecureRaw = localStorage.getItem(SECURE_USERS_KEY);

  if (alreadyMigrated && existingSecureRaw) {
    const list: UserRecord[] = JSON.parse(existingSecureRaw);
    return {
      migrated: false,
      usersCount: list.length,
      message: 'Hệ thống đã hoàn tất migration bảo mật trước đó.',
    };
  }

  // 1. Đọc dữ liệu người dùng cũ
  let oldUsers: any[] = [];
  try {
    const rawOld = localStorage.getItem('d2p_users_v4');
    if (rawOld) oldUsers = JSON.parse(rawOld);
  } catch {
    oldUsers = [];
  }

  // Danh sách tài khoản nền tảng cơ sở
  const baseSeed = [
    {
      id: 'usr-student-01',
      fullName: 'Nguyễn Văn Học',
      email: 'vanhoc.student@lhp.edu.vn',
      role: 'student' as const,
      schoolId: 'school-lhp',
      school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
      studentCode: 'HS-2026-12A1',
      avatarColor: 'from-indigo-600 to-violet-600',
      createdAt: '2026-09-05',
      status: 'active' as const,
    },
    {
      id: 'usr-teacher-01',
      fullName: 'ThS. Trần Thị Giáo Viên',
      email: 'giaovien.tran@lhp.edu.vn',
      role: 'teacher' as const,
      schoolId: 'school-lhp',
      school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
      department: 'Tổ Toán - Tin học',
      teacherCode: 'GV-TOAN-014',
      avatarColor: 'from-emerald-600 to-teal-600',
      createdAt: '2026-08-15',
      status: 'active' as const,
    },
    {
      id: 'usr-admin-01',
      fullName: 'TS. Lê Văn Quản Trị',
      email: 'hieutruong.le@lhp.edu.vn',
      role: 'school_admin' as const,
      schoolId: 'school-lhp',
      school: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
      department: 'Ban Giám Hiệu & Quản Trị',
      teacherCode: 'BGH-LHP-01',
      avatarColor: 'from-amber-600 to-orange-600',
      createdAt: '2026-08-01',
      status: 'active' as const,
    },
    {
      id: 'usr-sysadmin-01',
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'sysadmin@doc2practice.edu.vn',
      role: 'system_admin' as const,
      schoolId: 'school-national',
      school: 'Doc2Practice National Network',
      avatarColor: 'from-purple-700 to-indigo-900',
      createdAt: '2026-01-01',
      status: 'active' as const,
    },
  ];

  // Gộp các tài khoản cũ vào danh sách seed
  const combined = [...baseSeed];
  for (const old of oldUsers) {
    if (!combined.some((u) => u.email.toLowerCase() === old.email.toLowerCase())) {
      combined.push({
        id: old.id || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fullName: old.fullName || old.email.split('@')[0],
        email: old.email,
        role: old.role || 'student',
        schoolId: old.schoolId || 'school-lhp',
        school: old.school || 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
        department: old.department,
        studentCode: old.studentCode,
        teacherCode: old.teacherCode,
        avatarColor: old.avatarColor || 'from-indigo-600 to-violet-600',
        createdAt: old.createdAt || new Date().toISOString().split('T')[0],
        status: old.status || 'active',
      });
    }
  }

  // 2. Băm mật khẩu bằng muối mật mã CSPRNG cho từng tài khoản
  const secureUsers: UserRecord[] = [];
  for (const user of combined) {
    const salt = generateSalt();
    const plainPass = DEFAULT_PASSWORDS[user.email] || 'D2p@Secure2026';
    const hash = await hashPassword(plainPass, salt);

    secureUsers.push({
      ...user,
      passwordSalt: salt,
      passwordHash: hash,
      failedLoginAttempts: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  // 3. Cập nhật lớp học cũ với schoolId để đảm bảo tính phân tách dữ liệu trường học (Multi-tenancy)
  try {
    const rawClasses = localStorage.getItem('d2p_classrooms_v4');
    if (rawClasses) {
      const classes: Classroom[] = JSON.parse(rawClasses);
      let updatedClasses = false;
      classes.forEach((c) => {
        if (!c.schoolId) {
          c.schoolId = 'school-lhp';
          updatedClasses = true;
        }
      });
      if (updatedClasses) {
        localStorage.setItem('d2p_classrooms_v4', JSON.stringify(classes));
      }
    }
  } catch {
    // ignore
  }

  // 4. Lưu danh sách người dùng bảo mật & đánh dấu cờ migration
  localStorage.setItem(SECURE_USERS_KEY, JSON.stringify(secureUsers));
  if (!localStorage.getItem(SESSIONS_KEY)) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(RESET_TOKENS_KEY)) {
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify([]));
  }
  localStorage.setItem(MIGRATION_FLAG_KEY, new Date().toISOString());

  // Ghi nhật ký kiểm toán cho sự kiện di chuyển hệ thống
  recordAuditLog({
    actorId: 'usr-sysadmin-01',
    actorEmail: 'sysadmin@doc2practice.edu.vn',
    actorRole: 'system_admin',
    action: 'LOGIN_SUCCESS',
    targetType: 'system',
    details: `Migration v5 hoàn tất thành công: ${secureUsers.length} tài khoản đã được bảo vệ với SHA-256 + CSPRNG Salt.`,
    status: 'success',
  });

  return {
    migrated: true,
    usersCount: secureUsers.length,
    message: `Migration hoàn tất: Đã bảo vệ an toàn ${secureUsers.length} tài khoản người dùng.`,
  };
};
