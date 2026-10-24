/**
 * Suite kiểm thử tự động toàn diện cho Module Xác thực & Phân quyền Doc2Practice
 * Chạy bằng Node.js test runner: node --experimental-strip-types src/tests/auth.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Polyfill môi trường trình duyệt cho Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    get length() {
      return store.size;
    },
  } as any;
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as any;
  (globalThis as any).Event = class Event {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
  (globalThis as any).CustomEvent = class CustomEvent extends (globalThis as any).Event {
    detail: any;
    constructor(type: string, init?: any) {
      super(type);
      this.detail = init?.detail;
    }
  };
}

import { runAuthMigrations } from '../services/migration';
import {
  loginApi,
  logoutApi,
  registerStudentApi,
  registerTeacherApi,
  updateProfileApi,
  approveTeacherApi,
  requestPasswordResetApi,
  resetPasswordApi,
  validateSession,
  getSecureUsers,
} from '../services/authApi';
import { checkPermission } from '../services/rbac';
import { getAuditLogs } from '../services/auditService';
import type { UserProfile } from '../services/auth';

// Setup trước khi chạy test
test.before(async () => {
  localStorage.clear();
  await runAuthMigrations();
});

test('1. Kiểm tra: Chưa đăng nhập nhưng truy cập API hoặc tài nguyên yêu cầu xác thực', async () => {
  // A. Thẩm định quyền khi user = null (Mặc định từ chối)
  const decisionNoUser = checkPermission(null, 'class:create');
  assert.equal(decisionNoUser.allowed, false);
  assert.equal(decisionNoUser.code, 'UNAUTHORIZED');

  // B. Xác thực phiên làm việc với token rỗng
  const emptyTokenRes = validateSession('');
  assert.equal(emptyTokenRes.valid, false);

  // C. Xác thực phiên làm việc với token giả mạo
  const fakeTokenRes = validateSession('d2p_sess_fake_token_12345');
  assert.equal(fakeTokenRes.valid, false);
  assert.match(fakeTokenRes.error || '', /không tồn tại/i);

  // D. Gọi API cập nhật hồ sơ với token giả
  const updateRes = await updateProfileApi('fake_token', { fullName: 'Hacker' });
  assert.equal(updateRes.success, false);
  if (!updateRes.success) {
    assert.equal(updateRes.error.code, 'UNAUTHORIZED');
  }
});

test('2. Kiểm tra: Học sinh cố gọi API hoặc hành động dành cho Giáo viên', async () => {
  const studentUser: UserProfile = {
    id: 'usr-student-01',
    fullName: 'Nguyễn Văn Học',
    email: 'vanhoc.student@lhp.edu.vn',
    role: 'student',
    schoolId: 'school-lhp',
    avatarColor: 'from-indigo-600 to-violet-600',
    createdAt: '2026-09-05',
    status: 'active',
  };

  // A. Học sinh cố tạo lớp học
  const createClassDecision = checkPermission(studentUser, 'class:create');
  assert.equal(createClassDecision.allowed, false);
  assert.equal(createClassDecision.code, 'FORBIDDEN');
  assert.match(createClassDecision.reason || '', /student/i);

  // B. Học sinh cố tạo đề kiểm tra
  const createAsgDecision = checkPermission(studentUser, 'assignment:create');
  assert.equal(createAsgDecision.allowed, false);
  assert.equal(createAsgDecision.code, 'FORBIDDEN');

  // C. Học sinh cố giám sát phòng thi trực tiếp
  const monitorDecision = checkPermission(studentUser, 'proctor:monitor');
  assert.equal(monitorDecision.allowed, false);
  assert.equal(monitorDecision.code, 'FORBIDDEN');

  // D. Học sinh cố phê duyệt giáo viên
  const approveDecision = checkPermission(studentUser, 'teacher:approve');
  assert.equal(approveDecision.allowed, false);
  assert.equal(approveDecision.code, 'FORBIDDEN');
});

test('3. Kiểm tra: Giáo viên truy cập dữ liệu của trường hoặc lớp không được phân công', async () => {
  const teacherA: UserProfile = {
    id: 'usr-teacher-01',
    fullName: 'ThS. Trần Thị Giáo Viên',
    email: 'giaovien.tran@lhp.edu.vn',
    role: 'teacher',
    schoolId: 'school-lhp',
    avatarColor: 'from-emerald-600 to-teal-600',
    createdAt: '2026-08-15',
    status: 'active',
  };

  // A. Giáo viên A cố sửa lớp học do Giáo viên B (usr-teacher-02) phụ trách
  const editOtherClassDecision = checkPermission(teacherA, 'class:update', {
    resourceTeacherId: 'usr-teacher-02',
    resourceSchoolId: 'school-lhp',
  });
  assert.equal(editOtherClassDecision.allowed, false);
  assert.equal(editOtherClassDecision.code, 'FORBIDDEN');
  assert.match(editOtherClassDecision.reason || '', /chính mình phụ trách/i);

  // B. Giáo viên A (thuộc trường school-lhp) cố thao tác trên lớp thuộc trường school-cva
  const crossSchoolClassDecision = checkPermission(teacherA, 'class:read', {
    resourceTeacherId: 'usr-teacher-01',
    resourceSchoolId: 'school-cva', // Trường khác
  });
  assert.equal(crossSchoolClassDecision.allowed, false);
  assert.equal(crossSchoolClassDecision.code, 'FORBIDDEN');
  assert.match(crossSchoolClassDecision.reason || '', /Dữ liệu thuộc trường khác/i);

  // C. Giáo viên A thao tác trên lớp do chính mình phụ trách tại đúng trường của mình -> Cho phép
  const validClassDecision = checkPermission(teacherA, 'class:update', {
    resourceTeacherId: 'usr-teacher-01',
    resourceSchoolId: 'school-lhp',
  });
  assert.equal(validClassDecision.allowed, true);
});

test('4. Kiểm tra: School Admin truy cập dữ liệu của trường khác (Multi-tenancy boundary)', async () => {
  const adminLhp: UserProfile = {
    id: 'usr-admin-01',
    fullName: 'TS. Lê Văn Quản Trị',
    email: 'hieutruong.le@lhp.edu.vn',
    role: 'school_admin',
    schoolId: 'school-lhp',
    avatarColor: 'from-amber-600 to-orange-600',
    createdAt: '2026-08-01',
    status: 'active',
  };

  // A. Admin trường Lê Hồng Phong cố duyệt hồ sơ giáo viên nộp vào trường Chu Văn An (school-cva)
  const crossApproveDecision = checkPermission(adminLhp, 'teacher:approve', {
    targetSchoolId: 'school-cva',
    resourceSchoolId: 'school-cva',
  });
  assert.equal(crossApproveDecision.allowed, false);
  assert.equal(crossApproveDecision.code, 'FORBIDDEN');
  assert.match(crossApproveDecision.reason || '', /thuộc thẩm quyền trường của bạn|trường khác/i);

  // B. Admin trường Lê Hồng Phong duyệt hồ sơ giáo viên nộp vào trường Lê Hồng Phong -> Cho phép
  const validApproveDecision = checkPermission(adminLhp, 'teacher:approve', {
    targetSchoolId: 'school-lhp',
    resourceSchoolId: 'school-lhp',
  });
  assert.equal(validApproveDecision.allowed, true);

  // C. System Admin có quyền duyệt toàn quốc không bị giới hạn trường
  const sysAdmin: UserProfile = {
    id: 'usr-sysadmin-01',
    fullName: 'Quản Trị Viên Hệ Thống',
    email: 'sysadmin@doc2practice.edu.vn',
    role: 'system_admin',
    schoolId: 'school-national',
    avatarColor: 'from-purple-700 to-indigo-900',
    createdAt: '2026-01-01',
    status: 'active',
  };

  const sysAdminApproveDecision = checkPermission(sysAdmin, 'teacher:approve', {
    targetSchoolId: 'school-cva',
  });
  assert.equal(sysAdminApproveDecision.allowed, true);
});

test('5. Kiểm tra: Người dùng tự thay đổi role trong request (Chống leo thang đặc quyền)', async () => {
  // A. Đăng nhập học sinh lấy session token
  const loginRes = await loginApi({
    email: 'vanhoc.student@lhp.edu.vn',
    password: 'student123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;

  const studentToken = loginRes.data.token;

  // B. Học sinh gửi request updateProfile kèm role = "system_admin"
  const hackRoleRes = await updateProfileApi(studentToken, {
    fullName: 'Nguyễn Văn Học (Hacked)',
    role: 'system_admin' as any,
  });

  // PHẢI BỊ TỪ CHỐI THẲNG THỪNG VỚI MÃ 403 FORBIDDEN
  assert.equal(hackRoleRes.success, false);
  if (!hackRoleRes.success) {
    assert.equal(hackRoleRes.error.code, 'FORBIDDEN');
    assert.match(hackRoleRes.error.message, /không có quyền tự thay đổi vai trò/i);
  }

  // C. Kiểm tra Audit Log: Sự kiện leo thang đặc quyền phải được ghi nhận
  const logs = getAuditLogs({ action: 'ROLE_ESCALATION_BLOCKED' });
  assert.ok(logs.length > 0);
  assert.match(logs[0].details, /tự nâng quyền|leo thang/i);

  // D. Đăng ký học sinh mới nhưng cố gửi clientSuppliedRole = "teacher"
  const regRes = await registerStudentApi({
    fullName: 'Phạm Sinh Viên',
    email: `student.test.${Date.now()}@lhp.edu.vn`,
    password: 'Password123!',
    clientSuppliedRole: 'teacher',
  });
  assert.equal(regRes.success, true);
  if (regRes.success) {
    // Hệ thống cưỡng chế role = "student", không cho phép inject role
    assert.equal(regRes.data.role, 'student');
  }
});

test('6. Kiểm tra: Tài khoản giáo viên chưa được phê duyệt (Pending Verification)', async () => {
  const teacherEmail = `test.teacher.${Date.now()}@lhp.edu.vn`;

  // A. Giáo viên gửi hồ sơ đăng ký
  const regRes = await registerTeacherApi({
    fullName: 'Thầy Trần Đình Khôi',
    email: teacherEmail,
    password: 'TeacherSecure2026!',
    schoolName: 'THPT Chuyên Lê Hồng Phong',
    department: 'Tổ Toán - Tin học',
    teacherCode: 'GV-TOAN-999',
    proofDocumentName: 'Chung_chi_su_pham.pdf',
  });

  assert.equal(regRes.success, true);
  if (!regRes.success) return;

  assert.equal(regRes.data.request.status, 'pending');
  assert.equal(regRes.data.user.status, 'pending_approval');

  // B. Thử đăng nhập bằng tài khoản giáo viên khi chưa được duyệt
  const loginAttempt = await loginApi({
    email: teacherEmail,
    password: 'TeacherSecure2026!',
  });

  // PHẢI BỊ CHẶN VỚI MÃ ACCOUNT_PENDING_APPROVAL
  assert.equal(loginAttempt.success, false);
  if (!loginAttempt.success) {
    assert.equal(loginAttempt.error.code, 'ACCOUNT_PENDING_APPROVAL');
    assert.match(loginAttempt.error.message, /chờ Ban Giám Hiệu phê duyệt/i);
  }

  // C. Đăng nhập tài khoản School Admin để phê duyệt
  const adminLogin = await loginApi({
    email: 'hieutruong.le@lhp.edu.vn',
    password: 'admin123',
  });
  assert.equal(adminLogin.success, true);
  if (!adminLogin.success) return;

  const approveRes = await approveTeacherApi(adminLogin.data.token, regRes.data.request.id);
  assert.equal(approveRes.success, true);

  // D. Sau khi Ban Giám Hiệu phê duyệt, giáo viên đăng nhập thành công
  const loginAfterApproval = await loginApi({
    email: teacherEmail,
    password: 'TeacherSecure2026!',
  });
  assert.equal(loginAfterApproval.success, true);
  if (loginAfterApproval.success) {
    assert.equal(loginAfterApproval.data.user.role, 'teacher');
    assert.equal(loginAfterApproval.data.user.status, 'active');
  }
});

test('7. Kiểm tra: Đăng nhập sai, khóa tài khoản, đăng xuất và đặt lại mật khẩu', async () => {
  const targetEmail = 'vanhoc.student@lhp.edu.vn';

  // A. Đăng nhập sai mật khẩu 1 lần
  const wrongLogin1 = await loginApi({
    email: targetEmail,
    password: 'wrong_password_xyz',
  });
  assert.equal(wrongLogin1.success, false);
  if (!wrongLogin1.success) {
    assert.equal(wrongLogin1.error.code, 'INVALID_CREDENTIALS');
  }

  // B. Đăng nhập sai liên tiếp 4 lần nữa (tổng 5 lần) -> Tài khoản bị khóa (ACCOUNT_LOCKED)
  for (let i = 0; i < 4; i++) {
    await loginApi({ email: targetEmail, password: 'wrong_password_xyz' });
  }

  const lockedAttempt = await loginApi({
    email: targetEmail,
    password: 'student123', // Kể cả nhập đúng mật khẩu cũng bị chặn do đang bị khóa
  });
  assert.equal(lockedAttempt.success, false);
  if (!lockedAttempt.success) {
    assert.equal(lockedAttempt.error.code, 'ACCOUNT_LOCKED');
    assert.match(lockedAttempt.error.message, /bị tạm khóa/i);
  }

  // C. Quy trình Quên mật khẩu: Yêu cầu reset token
  const resetReq = await requestPasswordResetApi(targetEmail);
  assert.equal(resetReq.success, true);
  if (!resetReq.success) return;

  const resetToken = resetReq.data.resetToken;
  assert.ok(resetToken.startsWith('rst_'));

  // D. Đặt lại mật khẩu mới thông qua token
  const resetAction = await resetPasswordApi({
    token: resetToken,
    newPassword: 'NewStudentPass2026!',
  });
  assert.equal(resetAction.success, true);

  // E. Thử dùng lại token đã sử dụng -> Bị từ chối
  const reuseTokenAction = await resetPasswordApi({
    token: resetToken,
    newPassword: 'AnotherPass2026!',
  });
  assert.equal(reuseTokenAction.success, false);
  if (!reuseTokenAction.success) {
    assert.equal(reuseTokenAction.error.code, 'TOKEN_ALREADY_USED');
  }

  // F. Đăng nhập thành công bằng mật khẩu mới và mở khóa tài khoản
  const loginNewPass = await loginApi({
    email: targetEmail,
    password: 'NewStudentPass2026!',
  });
  assert.equal(loginNewPass.success, true);
  if (!loginNewPass.success) return;

  // G. Đăng xuất và kiểm tra vô hiệu hóa token phiên
  const activeToken = loginNewPass.data.token;
  const sessionCheckBefore = validateSession(activeToken);
  assert.equal(sessionCheckBefore.valid, true);

  logoutApi(activeToken);

  const sessionCheckAfter = validateSession(activeToken);
  assert.equal(sessionCheckAfter.valid, false);
  assert.match(sessionCheckAfter.error || '', /hết hiệu lực/i);
});

test('8. Kiểm tra: Không bao giờ trả mật khẩu hoặc salt trong response (Data Sanitization)', async () => {
  const users = getSecureUsers();
  assert.ok(users.length > 0);

  // Kiểm tra cơ sở dữ liệu nội bộ có hash & salt
  const internalUser = users[0];
  assert.ok(internalUser.passwordHash);
  assert.ok(internalUser.passwordSalt);
  assert.notEqual(internalUser.passwordHash, 'student123'); // Không phải plain text

  // Đăng nhập và kiểm tra dữ liệu trả về cho client
  const loginRes = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;

  const returnedUser = loginRes.data.user as any;
  // TUYỆT ĐỐI KHÔNG CÓ TRƯỜNG PASSWORDHASH HOẶC PASSWORDSALT
  assert.equal(returnedUser.passwordHash, undefined);
  assert.equal(returnedUser.passwordSalt, undefined);
  assert.equal(returnedUser.failedLoginAttempts, undefined);
});
