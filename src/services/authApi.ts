import type {
  UserRecord,
  Session,
  PasswordResetToken,
  TeacherApprovalRequest,
  ApiResult,
} from '../types';
import type { UserProfile } from './auth';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateCryptoToken,
  sanitizeUser,
} from './security';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';
import {
  SECURE_USERS_KEY,
  SESSIONS_KEY,
  RESET_TOKENS_KEY,
  runAuthMigrations,
} from './migration';
import { initialTeacherApprovals } from './auth';

const TEACHER_APPROVALS_KEY = 'd2p_teacher_approvals_v1';
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_EXPIRATION_DAYS = 7;
const RESET_TOKEN_EXPIRATION_MINUTES = 15;

// Helper: Lấy danh sách users từ secure storage
export const getSecureUsers = (): UserRecord[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SECURE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSecureUsers = (users: UserRecord[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SECURE_USERS_KEY, JSON.stringify(users));
};

// Helper: Lấy danh sách sessions
export const getSessions = (): Session[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions: Session[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

// Helper: Lấy danh sách reset tokens
export const getResetTokens = (): PasswordResetToken[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RESET_TOKENS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveResetTokens = (tokens: PasswordResetToken[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
};

// Helper: Lấy danh sách yêu cầu giáo viên
export const getApprovalRequests = (): TeacherApprovalRequest[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEACHER_APPROVALS_KEY);
    return raw ? JSON.parse(raw) : initialTeacherApprovals;
  } catch {
    return initialTeacherApprovals;
  }
};

const saveApprovalRequests = (reqs: TeacherApprovalRequest[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(TEACHER_APPROVALS_KEY, JSON.stringify(reqs));
  window.dispatchEvent(new Event('teacher_approvals_updated'));
};

/**
 * Xác thực token phiên làm việc hiện tại
 */
export const validateSession = (
  token: string | null | undefined
): { valid: boolean; user?: UserProfile; session?: Session; error?: string } => {
  if (!token) {
    return { valid: false, error: 'Thiếu mã xác thực phiên (Session Token).' };
  }

  const sessions = getSessions();
  const session = sessions.find((s) => s.token === token);
  if (!session) {
    return { valid: false, error: 'Phiên đăng nhập không tồn tại hoặc đã hết hiệu lực.' };
  }

  // Kiểm tra thời hạn phiên
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // Xóa session quá hạn
    const active = sessions.filter((s) => s.token !== token);
    saveSessions(active);
    return { valid: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  const users = getSecureUsers();
  const userRecord = users.find((u) => u.id === session.userId);
  if (!userRecord) {
    return { valid: false, error: 'Tài khoản người dùng không còn tồn tại trên hệ thống.' };
  }

  if (userRecord.status === 'locked') {
    return { valid: false, error: 'Tài khoản của bạn đã bị khóa để bảo vệ an toàn.' };
  }

  return { valid: true, user: sanitizeUser(userRecord), session };
};

/**
 * API Đăng nhập an toàn
 * - Kiểm tra mật khẩu băm SHA-256 + Salt
 * - Khóa tài khoản sau 5 lần sai liên tiếp
 * - Chặn tài khoản giáo viên chưa phê duyệt
 * - Cấp Token phiên có thời hạn
 */
export const loginApi = async (params: {
  email: string;
  password: string;
  userAgent?: string;
}): Promise<ApiResult<{ token: string; user: UserProfile }>> => {
  await runAuthMigrations();
  const users = getSecureUsers();
  const emailLower = params.email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === emailLower);

  // 1. Không tìm thấy tài khoản
  if (!user) {
    recordAuditLog({
      actorId: 'anonymous',
      actorEmail: emailLower,
      actorRole: 'anonymous',
      action: 'LOGIN_FAILED',
      targetType: 'user',
      details: 'Đăng nhập thất bại: Địa chỉ email không tồn tại trong hệ thống.',
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Tài khoản hoặc mật khẩu không chính xác.',
      },
    };
  }

  // 2. Kiểm tra tài khoản bị tạm khóa
  if (user.status === 'locked' && user.lockedUntil) {
    if (new Date(user.lockedUntil).getTime() > Date.now()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / (60 * 1000)
      );
      return {
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${remainingMinutes} phút hoặc đặt lại mật khẩu.`,
        },
      };
    } else {
      // Đã hết thời gian khóa -> mở lại
      user.status = 'active';
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      saveSecureUsers(users);
    }
  }

  // 3. Kiểm tra tài khoản giáo viên chưa duyệt
  if (user.role === 'teacher' && user.status === 'pending_approval') {
    recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN_FAILED',
      targetType: 'user',
      targetId: user.id,
      schoolId: user.schoolId,
      details: 'Đăng nhập bị từ chối: Hồ sơ giáo viên đang chờ Ban Giám Hiệu phê duyệt.',
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: 'ACCOUNT_PENDING_APPROVAL',
        message:
          'Hồ sơ giáo viên của bạn đang chờ Ban Giám Hiệu phê duyệt thẩm định. Vui lòng quay lại sau.',
      },
    };
  }

  // 4. Kiểm tra mật khẩu đã băm
  const isValid = await verifyPassword(params.password, user.passwordSalt, user.passwordHash);
  if (!isValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    let isLocked = false;

    if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
      user.status = 'locked';
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      isLocked = true;
      recordAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'ACCOUNT_LOCKED',
        targetType: 'user',
        targetId: user.id,
        schoolId: user.schoolId,
        details: `Tài khoản bị tạm khóa ${LOCKOUT_MINUTES} phút do nhập sai mật khẩu ${MAX_FAILED_LOGINS} lần liên tiếp.`,
        status: 'failure',
      });
    } else {
      recordAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'LOGIN_FAILED',
        targetType: 'user',
        targetId: user.id,
        schoolId: user.schoolId,
        details: `Đăng nhập thất bại: Sai mật khẩu (Lần ${user.failedLoginAttempts}/${MAX_FAILED_LOGINS}).`,
        status: 'failure',
      });
    }

    saveSecureUsers(users);

    return {
      success: false,
      error: {
        code: isLocked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
        message: isLocked
          ? `Bạn đã nhập sai quá ${MAX_FAILED_LOGINS} lần. Tài khoản bị tạm khóa trong ${LOCKOUT_MINUTES} phút.`
          : 'Tài khoản hoặc mật khẩu không chính xác.',
      },
    };
  }

  // 5. Đăng nhập thành công -> Reset failed counter
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  saveSecureUsers(users);

  // 6. Cấp token phiên mới
  const token = generateCryptoToken('d2p_sess', 32);
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const sessions = getSessions();
  sessions.unshift({
    token,
    userId: user.id,
    userRole: user.role,
    schoolId: user.schoolId,
    issuedAt,
    expiresAt,
    lastActiveAt: issuedAt,
    userAgent: params.userAgent || 'WebBrowser',
  });
  saveSessions(sessions);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'LOGIN_SUCCESS',
    targetType: 'user',
    targetId: user.id,
    schoolId: user.schoolId,
    details: `Đăng nhập thành công với vai trò "${user.role}". Đã cấp Session Token an toàn.`,
    status: 'success',
  });

  return {
    success: true,
    data: {
      token,
      user: sanitizeUser(user),
    },
    message: 'Đăng nhập thành công.',
  };
};

/**
 * API Đăng ký tài khoản học sinh
 * BẢO MẬT: Bất kể tham số client gửi lên là gì, vai trò bắt buộc là "student".
 */
export const registerStudentApi = async (params: {
  fullName: string;
  email: string;
  password: string;
  schoolId?: string;
  school?: string;
  studentCode?: string;
  clientSuppliedRole?: string; // Kiểm tra phòng ngừa Privilege Escalation
}): Promise<ApiResult<UserProfile>> => {
  await runAuthMigrations();
  const emailLower = params.email.trim().toLowerCase();

  // Kiểm tra nếu client cố tình inject role khác
  if (params.clientSuppliedRole && params.clientSuppliedRole !== 'student') {
    recordAuditLog({
      actorId: 'anonymous',
      actorEmail: emailLower,
      actorRole: 'anonymous',
      action: 'ROLE_ESCALATION_BLOCKED',
      targetType: 'user',
      details: `Phát hiện nỗ lực leo thang đặc quyền: Học sinh cố tình gửi role="${params.clientSuppliedRole}". Đã cưỡng chế về "student".`,
      status: 'failure',
    });
  }

  const users = getSecureUsers();
  const exists = users.find((u) => u.email.toLowerCase() === emailLower);
  if (exists) {
    return {
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.',
      },
    };
  }

  const salt = generateSalt();
  const hash = await hashPassword(params.password, salt);

  const newUser: UserRecord = {
    id: `usr-std-${Date.now()}`,
    fullName: params.fullName.trim(),
    email: emailLower,
    role: 'student', // BẮT BUỘC KHÔNG THỂ THAY ĐỔI
    schoolId: params.schoolId || 'school-lhp',
    school: params.school || 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
    studentCode: params.studentCode || `HS-${Math.floor(1000 + Math.random() * 9000)}`,
    avatarColor: 'from-indigo-600 to-violet-600',
    passwordSalt: salt,
    passwordHash: hash,
    failedLoginAttempts: 0,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  };

  users.push(newUser);
  saveSecureUsers(users);

  recordAuditLog({
    actorId: newUser.id,
    actorEmail: newUser.email,
    actorRole: 'student',
    action: 'REGISTER_STUDENT',
    targetType: 'user',
    targetId: newUser.id,
    schoolId: newUser.schoolId,
    details: 'Đăng ký tài khoản học sinh mới thành công và đã kích hoạt.',
    status: 'success',
  });

  return {
    success: true,
    data: sanitizeUser(newUser),
    message: 'Tạo tài khoản học sinh thành công.',
  };
};

/**
 * API Đăng ký tài khoản giáo viên (Bắt buộc qua xét duyệt)
 * - Trạng thái: "pending_approval"
 * - Chưa thể đăng nhập giảng dạy cho đến khi Ban Giám Hiệu duyệt
 */
export const registerTeacherApi = async (params: {
  fullName: string;
  email: string;
  password: string;
  schoolId?: string;
  schoolName: string;
  department: string;
  teacherCode: string;
  proofDocumentName?: string;
  notes?: string;
}): Promise<ApiResult<{ request: TeacherApprovalRequest; user: UserProfile }>> => {
  await runAuthMigrations();
  const emailLower = params.email.trim().toLowerCase();
  const users = getSecureUsers();

  if (users.some((u) => u.email.toLowerCase() === emailLower)) {
    return {
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Địa chỉ email này đã được sử dụng trên hệ thống.',
      },
    };
  }

  const salt = generateSalt();
  const hash = await hashPassword(params.password, salt);

  // Tạo tài khoản ở trạng thái CHỜ DUYỆT
  const newTeacher: UserRecord = {
    id: `usr-teacher-${Date.now()}`,
    fullName: params.fullName.trim(),
    email: emailLower,
    role: 'teacher',
    schoolId: params.schoolId || 'school-lhp',
    school: params.schoolName,
    department: params.department,
    teacherCode: params.teacherCode,
    avatarColor: 'from-emerald-600 to-teal-600',
    passwordSalt: salt,
    passwordHash: hash,
    failedLoginAttempts: 0,
    status: 'pending_approval', // BẢO MẬT: Chưa kích hoạt
    createdAt: new Date().toISOString().split('T')[0],
  };

  users.push(newTeacher);
  saveSecureUsers(users);

  // Ghi hồ sơ vào hàng đợi phê duyệt
  const requests = getApprovalRequests();
  const newRequest: TeacherApprovalRequest = {
    id: `req-${Date.now()}`,
    fullName: params.fullName.trim(),
    email: emailLower,
    schoolName: params.schoolName,
    department: params.department,
    teacherCode: params.teacherCode,
    proofDocumentName: params.proofDocumentName || 'Ho_so_minh_chung_su_pham.pdf',
    status: 'pending',
    submittedAt: 'Vừa xong',
    notes: params.notes || 'Đăng ký tài khoản giáo viên mới qua cổng trường học',
  };

  requests.unshift(newRequest);
  saveApprovalRequests(requests);

  recordAuditLog({
    actorId: newTeacher.id,
    actorEmail: newTeacher.email,
    actorRole: 'teacher',
    action: 'REGISTER_TEACHER_PENDING',
    targetType: 'teacher_request',
    targetId: newRequest.id,
    schoolId: newTeacher.schoolId,
    details: `Giáo viên mới gửi hồ sơ đăng ký. Trạng thái: Chờ Ban Giám Hiệu ${params.schoolName} phê duyệt.`,
    status: 'success',
  });

  return {
    success: true,
    data: {
      request: newRequest,
      user: sanitizeUser(newTeacher),
    },
    message: 'Hồ sơ đã được gửi và đang chờ Ban Giám Hiệu phê duyệt.',
  };
};

/**
 * API Đăng xuất & Hủy token phiên làm việc
 */
export const logoutApi = (sessionToken: string): ApiResult<{ loggedOut: boolean }> => {
  const sessions = getSessions();
  const found = sessions.find((s) => s.token === sessionToken);

  if (found) {
    const updated = sessions.filter((s) => s.token !== sessionToken);
    saveSessions(updated);

    recordAuditLog({
      actorId: found.userId,
      actorEmail: '',
      actorRole: found.userRole,
      action: 'LOGOUT',
      targetType: 'user',
      targetId: found.userId,
      schoolId: found.schoolId,
      details: 'Người dùng đã đăng xuất. Token phiên đã bị vô hiệu hóa an toàn.',
      status: 'success',
    });
  }

  return { success: true, data: { loggedOut: true }, message: 'Đăng xuất thành công.' };
};

/**
 * API Yêu cầu Đặt lại Mật khẩu (Forgot Password)
 * Sinh token có hạn 15 phút
 */
export const requestPasswordResetApi = async (
  email: string
): Promise<ApiResult<{ resetToken: string; expiresAt: string }>> => {
  await runAuthMigrations();
  const emailLower = email.trim().toLowerCase();
  const users = getSecureUsers();
  const user = users.find((u) => u.email.toLowerCase() === emailLower);

  // Sinh token bảo mật ngẫu nhiên
  const token = generateCryptoToken('rst', 20);
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000
  ).toISOString();

  const resetTokens = getResetTokens();
  resetTokens.unshift({
    token,
    email: emailLower,
    expiresAt,
    used: false,
    createdAt: new Date().toISOString(),
  });
  saveResetTokens(resetTokens);

  if (user) {
    recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'user',
      targetId: user.id,
      schoolId: user.schoolId,
      details: `Yêu cầu đặt lại mật khẩu đã được tạo (Hết hạn trong ${RESET_TOKEN_EXPIRATION_MINUTES} phút).`,
      status: 'success',
    });
  }

  return {
    success: true,
    data: { token, expiresAt },
    message: 'Nếu địa chỉ email tồn tại, liên kết khôi phục mật khẩu đã được tạo thành công.',
  };
};

/**
 * API Đặt lại Mật khẩu mới (Reset Password)
 */
export const resetPasswordApi = async (params: {
  token: string;
  newPassword: string;
}): Promise<ApiResult<{ resetCompleted: boolean }>> => {
  await runAuthMigrations();
  const tokens = getResetTokens();
  const found = tokens.find((t) => t.token === params.token);

  if (!found) {
    return {
      success: false,
      error: {
        code: 'INVALID_RESET_TOKEN',
        message: 'Mã khôi phục không hợp lệ hoặc không tồn tại.',
      },
    };
  }

  if (found.used) {
    return {
      success: false,
      error: {
        code: 'TOKEN_ALREADY_USED',
        message: 'Mã khôi phục này đã được sử dụng trước đó.',
      },
    };
  }

  if (new Date(found.expiresAt).getTime() < Date.now()) {
    return {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Mã khôi phục đã hết thời gian hiệu lực (quá 15 phút). Vui lòng yêu cầu lại.',
      },
    };
  }

  const users = getSecureUsers();
  const user = users.find((u) => u.email.toLowerCase() === found.email.toLowerCase());
  if (!user) {
    return {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản tương ứng với mã khôi phục.',
      },
    };
  }

  // Đổi mật khẩu với salt mới
  const newSalt = generateSalt();
  const newHash = await hashPassword(params.newPassword, newSalt);

  user.passwordSalt = newSalt;
  user.passwordHash = newHash;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  if (user.status === 'locked') {
    user.status = 'active';
  }
  user.updatedAt = new Date().toISOString();
  saveSecureUsers(users);

  found.used = true;
  saveResetTokens(tokens);

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'PASSWORD_RESET_COMPLETED',
    targetType: 'user',
    targetId: user.id,
    schoolId: user.schoolId,
    details: 'Mật khẩu tài khoản đã được đặt lại thành công. Khóa bảo mật được cập nhật mới.',
    status: 'success',
  });

  return {
    success: true,
    data: { resetCompleted: true },
    message: 'Đặt lại mật khẩu thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.',
  };
};

/**
 * API Cập nhật Thông tin Cá nhân
 * BẢO MẬT: Chặn mọi hành vi can thiệp nâng cấp vai trò (Privilege Escalation)
 */
export const updateProfileApi = async (
  sessionToken: string,
  updates: Partial<UserProfile> & { role?: any }
): Promise<ApiResult<UserProfile>> => {
  const sessionCheck = validateSession(sessionToken);
  if (!sessionCheck.valid || !sessionCheck.user) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: sessionCheck.error || 'Yêu cầu đăng nhập.',
      },
    };
  }

  const currentUser = sessionCheck.user;
  const users = getSecureUsers();
  const userRecord = users.find((u) => u.id === currentUser.id);
  if (!userRecord) {
    return {
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'Tài khoản không tồn tại.' },
    };
  }

  // BẢO MẬT: Phát hiện nỗ lực tự sửa role
  if (updates.role && updates.role !== userRecord.role) {
    recordAuditLog({
      actorId: userRecord.id,
      actorEmail: userRecord.email,
      actorRole: userRecord.role,
      action: 'ROLE_ESCALATION_BLOCKED',
      targetType: 'user',
      targetId: userRecord.id,
      schoolId: userRecord.schoolId,
      details: `CẢNH BÁO: Người dùng cố tình gửi tham số role="${updates.role}" để tự nâng quyền. Yêu cầu đã bị từ chối thẳng thừng.`,
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền tự thay đổi vai trò tài khoản.',
      },
    };
  }

  // Chỉ cho phép cập nhật các trường an toàn
  if (updates.fullName !== undefined) userRecord.fullName = updates.fullName.trim();
  if (updates.school !== undefined) userRecord.school = updates.school.trim();
  if (updates.department !== undefined) userRecord.department = updates.department.trim();
  if (updates.studentCode !== undefined) userRecord.studentCode = updates.studentCode.trim();
  if (updates.teacherCode !== undefined) userRecord.teacherCode = updates.teacherCode.trim();
  if (updates.avatarColor !== undefined) userRecord.avatarColor = updates.avatarColor;
  userRecord.updatedAt = new Date().toISOString();

  saveSecureUsers(users);

  recordAuditLog({
    actorId: userRecord.id,
    actorEmail: userRecord.email,
    actorRole: userRecord.role,
    action: 'PROFILE_UPDATED',
    targetType: 'user',
    targetId: userRecord.id,
    schoolId: userRecord.schoolId,
    details: 'Cập nhật thông tin hồ sơ cá nhân thành công.',
    status: 'success',
  });

  return {
    success: true,
    data: sanitizeUser(userRecord),
    message: 'Cập nhật hồ sơ thành công.',
  };
};

/**
 * API Phê duyệt Hồ sơ Giáo viên (Dành cho School Admin & System Admin)
 * BẢO MẬT: School Admin chỉ được duyệt giáo viên thuộc trường của mình!
 */
export const approveTeacherApi = async (
  sessionToken: string,
  requestId: string
): Promise<ApiResult<{ approved: boolean }>> => {
  const sessionCheck = validateSession(sessionToken);
  if (!sessionCheck.valid || !sessionCheck.user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const actor = sessionCheck.user;
  const requests = getApprovalRequests();
  const req = requests.find((r) => r.id === requestId);

  if (!req) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ yêu cầu.' },
    };
  }

  // Thẩm định quyền với kiểm tra phạm vi trường học (School Scope Enforcement)
  const users = getSecureUsers();
  const teacherUser = users.find((u) => u.email.toLowerCase() === req.email.toLowerCase());
  const targetSchoolId = teacherUser?.schoolId || (req.schoolName.includes('Lê Hồng Phong') ? 'school-lhp' : 'school-cva');

  const permDecision = checkPermission(actor, 'teacher:approve', {
    targetSchoolId,
    resourceSchoolId: targetSchoolId,
  });

  if (!permDecision.allowed) {
    recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'CROSS_SCHOOL_ACCESS_BLOCKED',
      targetType: 'teacher_request',
      targetId: requestId,
      schoolId: actor.schoolId,
      details: `Từ chối phê duyệt: School Admin trường ${actor.schoolId} cố tình duyệt giáo viên trường ${targetSchoolId}.`,
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: permDecision.code || 'FORBIDDEN',
        message: permDecision.reason || 'Bạn không có quyền phê duyệt hồ sơ này.',
      },
    };
  }

  // Phê duyệt hồ sơ
  req.status = 'approved';
  saveApprovalRequests(requests);

  // Kích hoạt tài khoản người dùng
  if (teacherUser) {
    teacherUser.status = 'active';
    teacherUser.updatedAt = new Date().toISOString();
    saveSecureUsers(users);
  }

  recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'TEACHER_APPROVED',
    targetType: 'teacher_request',
    targetId: requestId,
    schoolId: targetSchoolId,
    details: `Hồ sơ giáo viên "${req.fullName}" (${req.email}) đã được phê duyệt và kích hoạt quyền giảng dạy.`,
    status: 'success',
  });

  return {
    success: true,
    data: { approved: true },
    message: `Đã phê duyệt và kích hoạt tài khoản giáo viên cho ${req.fullName}.`,
  };
};

/**
 * API Từ chối Hồ sơ Giáo viên
 */
export const rejectTeacherApi = async (
  sessionToken: string,
  requestId: string,
  reason?: string
): Promise<ApiResult<{ rejected: boolean }>> => {
  const sessionCheck = validateSession(sessionToken);
  if (!sessionCheck.valid || !sessionCheck.user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập.' },
    };
  }

  const actor = sessionCheck.user;
  const requests = getApprovalRequests();
  const req = requests.find((r) => r.id === requestId);

  if (!req) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ yêu cầu.' },
    };
  }

  const permDecision = checkPermission(actor, 'teacher:approve');
  if (!permDecision.allowed) {
    return {
      success: false,
      error: {
        code: permDecision.code || 'FORBIDDEN',
        message: permDecision.reason || 'Bạn không có quyền thực hiện.',
      },
    };
  }

  req.status = 'rejected';
  saveApprovalRequests(requests);

  recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'TEACHER_REJECTED',
    targetType: 'teacher_request',
    targetId: requestId,
    details: `Từ chối hồ sơ giáo viên "${req.fullName}". Lý do: ${reason || 'Chưa đủ điều kiện minh chứng sư phạm.'}`,
    status: 'success',
  });

  return {
    success: true,
    data: { rejected: true },
    message: 'Đã từ chối hồ sơ giáo viên.',
  };
};
