import type { Permission, UserRole, UserRecord } from '../types';
import type { UserProfile } from './auth';

/**
 * Ngữ cảnh dữ liệu dùng để thẩm định quyền sở hữu và phạm vi trường học (ABAC)
 */
export interface AccessContext {
  resourceSchoolId?: string;
  resourceTeacherId?: string;
  resourceStudentId?: string;
  enrolledStudentIds?: string[];
  targetSchoolId?: string;
}

export interface AccessDecision {
  allowed: boolean;
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'ACCOUNT_PENDING_APPROVAL' | 'ACCOUNT_LOCKED';
  reason?: string;
}

/**
 * Bảng phân quyền vai trò cơ sở
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: ['class:read', 'assignment:submit'],
  teacher: [
    'class:create',
    'class:read',
    'class:update',
    'class:delete',
    'assignment:create',
    'proctor:monitor',
  ],
  school_admin: [
    'class:create',
    'class:read',
    'class:update',
    'teacher:approve',
    'audit:read',
  ],
  system_admin: [
    'class:create',
    'class:read',
    'class:update',
    'class:delete',
    'assignment:create',
    'assignment:submit',
    'proctor:monitor',
    'teacher:approve',
    'school:manage',
    'audit:read',
  ],
};

/**
 * Thẩm định quyền theo nguyên tắc Mặc Định Từ Chối (Deny by Default)
 * Kiểm tra cả quyền hạn (RBAC) lẫn phạm vi trường học / quyền sở hữu dữ liệu (ABAC).
 */
export const checkPermission = (
  user: UserProfile | UserRecord | null | undefined,
  permission: Permission,
  context?: AccessContext
): AccessDecision => {
  // 1. Chưa xác thực (Chưa có user) -> Mặc định từ chối 401
  if (!user) {
    return {
      allowed: false,
      code: 'UNAUTHORIZED',
      reason: 'Yêu cầu đăng nhập để thực hiện thao tác này.',
    };
  }

  // 2. Tài khoản đang bị khóa
  if ((user as any).status === 'locked') {
    return {
      allowed: false,
      code: 'ACCOUNT_LOCKED',
      reason: 'Tài khoản của bạn hiện đang bị tạm khóa vì lý do an toàn.',
    };
  }

  // 3. Tài khoản giáo viên chưa được phê duyệt
  if (user.role === 'teacher' && (user as any).status === 'pending_approval') {
    return {
      allowed: false,
      code: 'ACCOUNT_PENDING_APPROVAL',
      reason: 'Hồ sơ sư phạm của bạn đang chờ Ban Giám Hiệu phê duyệt trước khi có thể giảng dạy hoặc tạo lớp.',
    };
  }

  // 4. System Admin có toàn quyền hệ thống
  if (user.role === 'system_admin') {
    return { allowed: true };
  }

  // 5. Kiểm tra quyền cơ sở theo vai trò
  const allowedPermissions = ROLE_PERMISSIONS[user.role] || [];
  if (!allowedPermissions.includes(permission)) {
    return {
      allowed: false,
      code: 'FORBIDDEN',
      reason: `Vai trò "${user.role}" không có quyền thực hiện hành động "${permission}".`,
    };
  }

  // 6. Kiểm tra phạm vi dữ liệu theo trường học (Multi-tenancy & School Scoping)
  if (context?.resourceSchoolId && user.schoolId) {
    // Nếu tài nguyên thuộc trường A nhưng người dùng thuộc trường B
    if (context.resourceSchoolId !== user.schoolId) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: `Quyền bị từ chối: Dữ liệu thuộc trường khác (${context.resourceSchoolId}), không thuộc thẩm quyền trường của bạn (${user.schoolId}).`,
      };
    }
  }

  // 7. Quyền đặc thù của School Admin: Chỉ được duyệt giáo viên thuộc trường mình
  if (permission === 'teacher:approve' && user.role === 'school_admin') {
    if (context?.targetSchoolId && user.schoolId && context.targetSchoolId !== user.schoolId) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Quản trị viên trường chỉ được phê duyệt hồ sơ giáo viên thuộc trường của mình.',
      };
    }
  }

  // 8. Quyền đặc thù của Giáo viên: Chỉ được sửa/xóa lớp hoặc giao bài trong lớp do mình quản lý
  if (user.role === 'teacher') {
    if (
      (permission === 'class:update' ||
        permission === 'class:delete' ||
        permission === 'assignment:create' ||
        permission === 'proctor:monitor') &&
      context?.resourceTeacherId &&
      context.resourceTeacherId !== user.id
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Giáo viên chỉ có quyền quản lý và giao đề thi cho các lớp học do chính mình phụ trách.',
      };
    }
  }

  // 9. Quyền của Học sinh: Chỉ được xem lớp và làm bài tập của lớp mình đã tham gia
  if (user.role === 'student' && permission === 'class:read') {
    if (
      context?.enrolledStudentIds &&
      !context.enrolledStudentIds.includes(user.id)
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Học sinh chưa tham gia lớp học này nên không có quyền truy cập nội dung.',
      };
    }
  }

  return { allowed: true };
};
