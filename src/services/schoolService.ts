import type { School, UserRole, ApiResult } from '../types';
import { getCurrentUser } from './auth';
import { checkPermission } from './rbac';
import { recordAuditLog } from './auditService';
import { getSecureUsers } from './authApi';
import { getClassrooms } from './classService';
import { mockSchools } from '../data/mockData';

const SCHOOLS_KEY = 'd2p_schools_v1';

export const initialSchools: School[] = mockSchools.map((s) => ({
  ...s,
  description: s.name.includes('Lê Hồng Phong')
    ? 'Trường THPT Chuyên trọng điểm khu vực phía Nam với bề dày thành tích xuất sắc.'
    : s.name.includes('Chu Văn An')
    ? 'Ngôi trường trung học phổ thông danh giá hơn 100 năm tuổi tại thủ đô Hà Nội.'
    : 'Trường đại học thành viên ĐHQG TP.HCM đào tạo hàng đầu ngành Công nghệ Thông tin.',
  status: s.status as 'active' | 'suspended',
  updatedAt: s.createdAt,
}));

export const initSchoolStorage = (): School[] => {
  if (typeof localStorage === 'undefined') return initialSchools;
  const raw = localStorage.getItem(SCHOOLS_KEY);
  if (!raw) {
    localStorage.setItem(SCHOOLS_KEY, JSON.stringify(initialSchools));
    return initialSchools;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(SCHOOLS_KEY, JSON.stringify(initialSchools));
    return initialSchools;
  }
};

/**
 * Lấy danh sách trường học có tìm kiếm và bộ lọc trạng thái.
 * Phân quyền:
 * - System Admin: Xem tất cả các trường.
 * - School Admin, Teacher, Student: Chỉ xem trường của mình.
 */
export const getSchools = (filter?: {
  search?: string;
  status?: string;
}): School[] => {
  const user = getCurrentUser();
  const schools = initSchoolStorage();

  // Cập nhật số liệu thống kê thời gian thực từ User và Classroom store
  const secureUsers = getSecureUsers();
  const classrooms = getClassrooms();

  const enriched = schools.map((sch) => {
    const schoolUsers = secureUsers.filter((u) => u.schoolId === sch.id && u.status === 'active');
    const teachers = schoolUsers.filter((u) => u.role === 'teacher').length;
    const students = schoolUsers.filter((u) => u.role === 'student').length;
    const classes = classrooms.filter((c) => c.schoolId === sch.id && c.status !== 'archived').length;

    return {
      ...sch,
      teacherCount: teachers > 0 ? teachers : sch.teacherCount,
      studentCount: students > 0 ? students : sch.studentCount,
      classCount: classes > 0 ? classes : sch.classCount,
    };
  });

  let result = enriched;

  // Nếu không phải System Admin, chỉ được xem trường của mình
  if (user && user.role !== 'system_admin') {
    result = result.filter((s) => s.id === user.schoolId);
  }

  if (filter?.status && filter.status !== 'all') {
    result = result.filter((s) => s.status === filter.status);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }

  return result;
};

export const getSchoolById = (id: string): School | undefined => {
  const schools = getSchools();
  return schools.find((s) => s.id === id);
};

/**
 * Tạo trường học mới (Dành riêng cho Quản trị viên Toàn hệ thống - System Admin)
 */
export const createSchool = (params: {
  code: string;
  name: string;
  level: School['level'];
  address: string;
  phone: string;
  email: string;
  description?: string;
}): ApiResult<School> => {
  const user = getCurrentUser();
  const decision = checkPermission(user, 'school:manage');

  if (!decision.allowed) {
    recordAuditLog({
      actorId: user?.id || 'anonymous',
      actorEmail: user?.email || '',
      actorRole: user?.role || 'anonymous',
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      targetType: 'school',
      details: decision.reason || 'Từ chối: Chỉ System Admin mới có quyền tạo trường học mới.',
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: decision.code || 'FORBIDDEN',
        message: decision.reason || 'Bạn không có quyền thực hiện chức năng này.',
      },
    };
  }

  const schools = initSchoolStorage();
  const normalizedCode = params.code.trim().toUpperCase();

  // Kiểm tra mã trường trùng lặp (SchoolCode Unique)
  const existingCode = schools.find((s) => s.code.toUpperCase() === normalizedCode);
  if (existingCode) {
    return {
      success: false,
      error: {
        code: 'DUPLICATE_CODE',
        message: `Mã trường "${normalizedCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác.`,
      },
    };
  }

  const newSchool: School = {
    id: `sch-${Date.now()}`,
    code: normalizedCode,
    name: params.name.trim(),
    level: params.level,
    address: params.address.trim(),
    phone: params.phone.trim(),
    email: params.email.trim().toLowerCase(),
    description: params.description?.trim() || '',
    teacherCount: 0,
    studentCount: 0,
    classCount: 0,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  schools.unshift(newSchool);
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SCHOOL_CREATED',
    targetType: 'school',
    targetId: newSchool.id,
    schoolId: newSchool.id,
    details: `Tạo trường học mới: "${newSchool.name}" (${newSchool.code}).`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('schools_updated'));
  }

  return { success: true, data: newSchool, message: `Tạo thành công trường "${newSchool.name}"!` };
};

/**
 * Cập nhật thông tin trường học
 */
export const updateSchool = (
  id: string,
  params: Partial<Pick<School, 'name' | 'level' | 'address' | 'phone' | 'email' | 'description' | 'code'>>
): ApiResult<School> => {
  const user = getCurrentUser();
  const decision = checkPermission(user, 'school:manage');

  if (!decision.allowed) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Chỉ System Admin mới có quyền cập nhật thông tin trường học.' },
    };
  }

  const schools = initSchoolStorage();
  const index = schools.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy trường học tương ứng.' } };
  }

  // Nếu cập nhật mã trường, phải kiểm tra tính duy nhất
  if (params.code) {
    const normalizedCode = params.code.trim().toUpperCase();
    const duplicate = schools.find((s) => s.id !== id && s.code.toUpperCase() === normalizedCode);
    if (duplicate) {
      return {
        success: false,
        error: { code: 'DUPLICATE_CODE', message: `Mã trường "${normalizedCode}" đã được trường khác sử dụng.` },
      };
    }
    params.code = normalizedCode;
  }

  const updated: School = {
    ...schools[index],
    ...params,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  schools[index] = updated;
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SCHOOL_UPDATED',
    targetType: 'school',
    targetId: id,
    schoolId: id,
    details: `Cập nhật thông tin trường: "${updated.name}" (${updated.code}).`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('schools_updated'));
  }

  return { success: true, data: updated, message: 'Cập nhật trường học thành công.' };
};

/**
 * Kích hoạt hoặc Tạm ngừng hoạt động trường học (Soft state change, ngăn xóa cứng)
 */
export const toggleSchoolStatus = (id: string, newStatus: 'active' | 'suspended'): ApiResult<School> => {
  const user = getCurrentUser();
  const decision = checkPermission(user, 'school:manage');

  if (!decision.allowed) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Chỉ System Admin mới có quyền đổi trạng thái hoạt động của trường.' },
    };
  }

  const schools = initSchoolStorage();
  const index = schools.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy trường học tương ứng.' } };
  }

  const target = schools[index];
  target.status = newStatus;
  target.updatedAt = new Date().toISOString().split('T')[0];

  schools[index] = target;
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));

  recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SCHOOL_STATUS_CHANGED',
    targetType: 'school',
    targetId: id,
    schoolId: id,
    details: `Chuyển trạng thái trường "${target.name}" sang "${newStatus === 'active' ? 'Đang hoạt động' : 'Tạm ngừng'}".`,
    status: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('schools_updated'));
  }

  return {
    success: true,
    data: target,
    message: `Đã ${newStatus === 'active' ? 'kích hoạt' : 'tạm ngừng'} trường "${target.name}".`,
  };
};

/**
 * Lấy danh sách thành viên (giáo viên, học sinh, quản trị viên) theo trường học.
 * Bảo mật: School Admin chỉ được xem trường của mình.
 */
export const getSchoolMembers = (
  schoolId: string,
  filter?: { role?: UserRole; search?: string }
): ApiResult<Array<{ id: string; fullName: string; email: string; role: UserRole; status: string; studentCode?: string; teacherCode?: string; department?: string }>> => {
  const user = getCurrentUser();

  // Kiểm tra quyền: System Admin xem được mọi trường, School Admin chỉ xem trường của mình
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' } };
  }

  if (user.role !== 'system_admin' && user.schoolId !== schoolId) {
    recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CROSS_SCHOOL_ACCESS_BLOCKED',
      targetType: 'school',
      targetId: schoolId,
      details: `School Admin (${user.schoolId}) cố tình truy cập danh sách nhân sự của trường (${schoolId}).`,
      status: 'failure',
    });
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền truy cập dữ liệu nhân sự của trường học khác.',
      },
    };
  }

  const secureUsers = getSecureUsers();
  let members = secureUsers.filter((u) => u.schoolId === schoolId);

  if (filter?.role) {
    members = members.filter((u) => u.role === filter.role);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    members = members.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentCode && u.studentCode.toLowerCase().includes(q)) ||
        (u.teacherCode && u.teacherCode.toLowerCase().includes(q))
    );
  }

  // Khử nhạy cảm trước khi trả về
  const sanitized = members.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    studentCode: u.studentCode,
    teacherCode: u.teacherCode,
    department: u.department,
  }));

  return { success: true, data: sanitized };
};

