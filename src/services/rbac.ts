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
  resourceOwnerId?: string;
  resourceScope?: 'personal' | 'school_shared' | 'global_shared';
  sharedClassIds?: string[];
  enrolledClassIds?: string[];
  materialStatus?: 'draft' | 'published' | 'archived';
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
  student: [
    'class:read',
    'class:join',
    'assignment:submit',
    'subject:read',
    'school:read',
    'material:read',
    'question:read',
    'assessment:read',
    'assessment:take',
  ],
  teacher: [
    'class:create',
    'class:read',
    'class:update',
    'class:delete',
    'class:review_requests',
    'assignment:create',
    'proctor:monitor',
    'subject:read',
    'school:read',
    'material:create',
    'material:read',
    'material:update',
    'material:delete',
    'material:share',
    'question:create',
    'question:read',
    'question:update',
    'question:delete',
    'question:share',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete',
    'assessment:publish',
    'assessment:grade',
  ],
  school_admin: [
    'class:create',
    'class:read',
    'class:update',
    'class:delete',
    'class:assign_teacher',
    'class:review_requests',
    'teacher:approve',
    'subject:manage',
    'subject:read',
    'school:read',
    'material:create',
    'material:read',
    'material:update',
    'material:delete',
    'material:share',
    'question:create',
    'question:read',
    'question:update',
    'question:delete',
    'question:share',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete',
    'assessment:publish',
    'assessment:grade',
    'audit:read',
  ],
  system_admin: [
    'class:create',
    'class:read',
    'class:update',
    'class:delete',
    'class:assign_teacher',
    'class:review_requests',
    'class:join',
    'assignment:create',
    'assignment:submit',
    'proctor:monitor',
    'teacher:approve',
    'school:manage',
    'school:read',
    'subject:manage',
    'subject:read',
    'material:create',
    'material:read',
    'material:update',
    'material:delete',
    'material:share',
    'question:create',
    'question:read',
    'question:update',
    'question:delete',
    'question:share',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete',
    'assessment:publish',
    'assessment:grade',
    'assessment:take',
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

  // 8. Quyền đặc thù của Giáo viên: Chỉ được sửa/xóa lớp, duyệt yêu cầu hoặc giao bài trong lớp do mình quản lý
  if (user.role === 'teacher') {
    // Không thể tạo lớp cho trường khác
    if (permission === 'class:create' && context?.targetSchoolId && user.schoolId && context.targetSchoolId !== user.schoolId) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Giáo viên chỉ được tạo lớp học thuộc trường mà mình đang công tác.',
      };
    }

    if (
      (permission === 'class:update' ||
        permission === 'class:delete' ||
        permission === 'class:review_requests' ||
        permission === 'assignment:create' ||
        permission === 'proctor:monitor') &&
      context?.resourceTeacherId &&
      context.resourceTeacherId !== user.id
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Giáo viên chỉ có quyền quản lý, duyệt thành viên và giao đề thi cho các lớp học do chính mình phụ trách.',
      };
    }
  }

  // 9. Quyền quản lý môn học: School Admin chỉ quản lý môn thuộc trường mình, không được sửa môn dùng chung toàn quốc (global)
  if (permission === 'subject:manage' && user.role === 'school_admin') {
    if (context?.resourceSchoolId && context.resourceSchoolId === 'global') {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Quản trị viên trường không có quyền thay đổi danh mục môn học dùng chung toàn hệ thống.',
      };
    }
  }

  // 10. Quyền của Học sinh: Chỉ được xem lớp và làm bài tập của lớp mình đã tham gia
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

  // 11. Quyền xem & truy cập tài liệu học tập (Materials ABAC)
  if (permission === 'material:read' && user.role === 'student') {
    // Học sinh không được xem tài liệu nháp hoặc đã lưu trữ
    if (context?.materialStatus && context.materialStatus !== 'published') {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Học sinh chỉ có thể truy cập các tài liệu học tập đã được giáo viên công bố chính thức.',
      };
    }
    // Học sinh chỉ được xem tài liệu chia sẻ cho lớp mà mình tham gia
    if (
      context?.sharedClassIds &&
      context?.enrolledClassIds &&
      !context.sharedClassIds.some((cid) => context.enrolledClassIds?.includes(cid))
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Tài liệu này không được chia sẻ cho bất kỳ lớp học nào bạn đang tham gia.',
      };
    }
  }

  // 12. Quyền chỉnh sửa, chia sẻ, xóa tài liệu (Material Modification ABAC)
  if (
    (permission === 'material:update' ||
      permission === 'material:delete' ||
      permission === 'material:share') &&
    user.role === 'teacher'
  ) {
    if (context?.resourceOwnerId && context.resourceOwnerId !== user.id) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Giáo viên chỉ có quyền chỉnh sửa, chia sẻ hoặc xóa tài liệu do chính mình tải lên.',
      };
    }
  }

  // 13. Quyền Ngân hàng câu hỏi (Question Bank ABAC)
  if (user.role === 'teacher') {
    if (
      (permission === 'question:update' || permission === 'question:delete') &&
      context?.resourceOwnerId &&
      context.resourceOwnerId !== user.id
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Giáo viên chỉ có quyền chỉnh sửa hoặc xóa câu hỏi trong kho cá nhân do chính mình biên soạn.',
      };
    }

    if (
      permission === 'question:read' &&
      context?.resourceScope === 'personal' &&
      context?.resourceOwnerId &&
      context.resourceOwnerId !== user.id
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Câu hỏi riêng tư thuộc kho cá nhân của giáo viên khác, không được phép truy cập.',
      };
    }
  }

  // 14. Quyền Đề kiểm tra & Giao bài tập (Assessment ABAC)
  if (user.role === 'teacher') {
    if (
      (permission === 'assessment:create' ||
        permission === 'assessment:update' ||
        permission === 'assessment:delete' ||
        permission === 'assessment:publish' ||
        permission === 'assessment:grade') &&
      context?.resourceTeacherId &&
      context.resourceTeacherId !== user.id
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Giáo viên chỉ có quyền quản lý, giao bài và chấm điểm cho các lớp học do mình trực tiếp phụ trách.',
      };
    }
  }

  if (user.role === 'student') {
    if (
      (permission === 'assessment:read' || permission === 'assessment:take') &&
      context?.enrolledStudentIds &&
      !context.enrolledStudentIds.includes(user.id)
    ) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        reason: 'Học sinh không thuộc danh sách lớp được giao bài kiểm tra này.',
      };
    }
  }

  return { allowed: true };
};

