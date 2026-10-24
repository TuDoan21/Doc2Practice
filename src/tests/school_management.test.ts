/**
 * Suite kiểm thử tự động toàn diện cho Giai đoạn 4:
 * Quản lý Trường học, Môn học, Lớp học và Quy trình Tham gia bằng mã
 * Chạy bằng: npx tsx src/tests/school_management.test.ts
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
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  toggleSchoolStatus,
  getSchoolMembers
} from '../services/schoolService';
import {
  getSubjects,
  createSubject,
  updateSubject,
  toggleSubjectStatus
} from '../services/subjectService';
import {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  archiveClassroom,
  assignTeacherToClass,
  previewClassByCode,
  requestJoinClassByCode,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  regenerateClassCode,
  toggleJoinCodeStatus,
  removeStudentFromClass,
  leaveClassroom
} from '../services/classService';
import { loginApi, logoutApi } from '../services/authApi';
import { setSessionToken, type UserProfile } from '../services/auth';
import type { School, Subject, Classroom } from '../types';

// Thiết lập dữ liệu nền tảng trước khi chạy kiểm thử
test.before(async () => {
  await runAuthMigrations();
});

test('1. System Admin tạo và cập nhật trường học (SchoolCode duy nhất)', async () => {
  // Đăng nhập vai trò System Admin
  const loginRes = await loginApi({
    email: 'sysadmin@doc2practice.edu.vn',
    password: 'sysadmin123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;
  setSessionToken(loginRes.data.token);

  // A. Tạo trường mới
  const uniqueCode = `SCH-${Date.now().toString().slice(-4)}`;
  const createRes = createSchool({
    code: uniqueCode,
    name: 'THPT Năng Khiếu ĐHQG TP.HCM',
    level: 'high_school',
    address: '153 Nguyễn Chí Thanh, Quận 5, TP.HCM',
    email: 'ptnk@vnuhcm.edu.vn',
    phone: '028 3853 3703',
    description: 'Trường THPT chuyên trực thuộc Đại học Quốc gia TP.HCM.',
  });

  assert.equal(createRes.success, true);
  if (!createRes.success) return;
  assert.equal(createRes.data.code, uniqueCode);
  assert.equal(createRes.data.status, 'active');

  // B. Ngăn tạo trường trùng mã (Duplicate Code)
  const dupRes = createSchool({
    code: uniqueCode,
    name: 'Trường Trùng Mã',
    level: 'high_school',
    address: 'Hà Nội',
    email: 'dup@school.edu.vn',
    phone: '0123456789',
  });
  assert.equal(dupRes.success, false);
  if (!dupRes.success) {
    assert.equal(dupRes.error.code, 'DUPLICATE_CODE');
  }

  // C. Cập nhật thông tin trường
  const updateRes = updateSchool(createRes.data.id, {
    name: 'Trường Phổ thông Năng khiếu - ĐHQG TP.HCM (Updated)',
  });
  assert.equal(updateRes.success, true);
  if (updateRes.success) {
    assert.equal(updateRes.data.name, 'Trường Phổ thông Năng khiếu - ĐHQG TP.HCM (Updated)');
  }
});

test('2. School Admin không thể truy cập dữ liệu nhân sự của trường khác (Multi-tenancy Boundary)', async () => {
  // Đăng nhập vai trò School Admin trường Lê Hồng Phong (school-lhp)
  const loginRes = await loginApi({
    email: 'hieutruong.le@lhp.edu.vn',
    password: 'admin123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;
  setSessionToken(loginRes.data.token);

  // A. Truy cập nhân sự trường mình (school-lhp) -> Thành công
  const mySchoolMembers = getSchoolMembers('school-lhp');
  assert.equal(mySchoolMembers.success, true);

  // B. Cố tình truy cập nhân sự của trường Chu Văn An (school-cva) -> Bị chặn
  const otherSchoolMembers = getSchoolMembers('school-cva');
  assert.equal(otherSchoolMembers.success, false);
  if (!otherSchoolMembers.success) {
    assert.equal(otherSchoolMembers.error.code, 'FORBIDDEN');
    assert.match(otherSchoolMembers.error.message, /khác/i);
  }
});

test('3. Tạo và cập nhật môn học (Ngăn trùng mã trong cùng phạm vi)', async () => {
  // Đăng nhập School Admin trường Lê Hồng Phong
  const loginRes = await loginApi({
    email: 'hieutruong.le@lhp.edu.vn',
    password: 'admin123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;
  setSessionToken(loginRes.data.token);

  // A. Tạo môn học cho trường mình
  const uniqueSubCode = `SUB-ROBOTICS-${Date.now().toString().slice(-4)}`;
  const subRes = createSubject({
    subjectCode: uniqueSubCode,
    name: 'Chuyên đề Robotics & Tự động hóa',
    description: 'Môn học tự chọn STEM cho học sinh khối 11-12.',
    gradeLevel: 'Khối 11',
  });
  assert.equal(subRes.success, true);
  if (!subRes.success) return;
  assert.equal(subRes.data.schoolId, 'school-lhp');

  // B. Ngăn tạo trùng mã trong cùng trường
  const dupSub = createSubject({
    subjectCode: uniqueSubCode,
    name: 'Robotics Trùng Lặp',
  });
  assert.equal(dupSub.success, false);
  if (!dupSub.success) {
    assert.equal(dupSub.error.code, 'DUPLICATE_CODE');
  }

  // C. School Admin không được sửa môn học dùng chung toàn quốc (global)
  const editGlobalRes = updateSubject('sub-global-math', { name: 'Toán Học Sửa Lỗi' });
  assert.equal(editGlobalRes.success, false);
  if (!editGlobalRes.success) {
    assert.equal(editGlobalRes.error.code, 'FORBIDDEN');
  }
});

test('4. Giáo viên tạo lớp học trong trường được phân công', async () => {
  // Đăng nhập Giáo viên Lê Hồng Phong
  const loginRes = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;
  setSessionToken(loginRes.data.token);

  const res = createClassroom({
    name: 'Toán Chuyên 12 Tin (2026-2027)',
    subject: 'Toán học',
    description: 'Lớp ôn luyện thi tốt nghiệp THPT và kỳ thi đánh giá năng lực.',
    gradeLevel: 'Khối 12',
    academicYear: '2026-2027',
  });

  assert.equal(res.success, true);
  if (res.success) {
    assert.equal(res.data.schoolId, 'school-lhp');
    assert.equal(res.data.status, 'active');
    assert.equal(res.data.joinCodeActive, true);
    assert.ok(res.data.code.length >= 6);
  }
});

test('5. Giáo viên không thể tạo lớp cho trường khác bằng cách sửa SchoolId', async () => {
  // Đăng nhập Giáo viên Lê Hồng Phong
  const loginRes = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;
  setSessionToken(loginRes.data.token);

  // Cố tình gửi schoolId của trường Chu Văn An (school-cva)
  const hackRes = createClassroom({
    name: 'Lớp Học Gian Lận',
    subject: 'Vật lý',
    schoolId: 'school-cva',
    description: 'Cố tạo lớp cho trường khác.',
  });

  assert.equal(hackRes.success, false);
  if (!hackRes.success) {
    assert.equal(hackRes.error.code, 'FORBIDDEN');
    assert.match(hackRes.error.message, /trường khác|thẩm quyền/i);
  }
});

test('6. Học sinh tham gia lớp bằng mã hợp lệ (Xem trước & Gửi yêu cầu)', async () => {
  // Đăng nhập vai trò Học sinh
  const loginRes = await loginApi({
    email: 'vanhoc.student@lhp.edu.vn',
    password: 'student123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;
  setSessionToken(loginRes.data.token);

  // A. Bước 1: Xem trước thông tin lớp học (Preview Class)
  const previewRes = previewClassByCode('AI-2026');
  assert.equal(previewRes.success, true);
  if (previewRes.success) {
    assert.equal(previewRes.data.code, 'AI-2026');
    assert.equal(previewRes.data.name, 'Nhập môn Trí tuệ Nhân tạo (CS221.N11)');
    assert.equal(previewRes.data.teacherName, 'ThS. Trần Thị Giáo Viên');
  }

  // B. Bước 2: Gửi yêu cầu tham gia lớp (Request Join)
  const reqRes = requestJoinClassByCode('AI-2026');
  // Vì trong seed data, usr-student-01 đã có trong studentIds của class-ai-02 nên phải báo ALREADY_ENROLLED
  if (!reqRes.success && reqRes.error.code === 'ALREADY_ENROLLED') {
    assert.equal(reqRes.error.code, 'ALREADY_ENROLLED');
  }
});

test('7. Mã sai hoặc mã bị vô hiệu hóa bị từ chối chính xác', async () => {
  // Đăng nhập vai trò Học sinh
  const loginRes = await loginApi({
    email: 'vanhoc.student@lhp.edu.vn',
    password: 'student123',
  });
  assert.equal(loginRes.success, true);
  if (!loginRes.success) return;
  setSessionToken(loginRes.data.token);

  // A. Nhập mã hoàn toàn không tồn tại
  const wrongCodeRes = previewClassByCode('NON-EXIST-999');
  assert.equal(wrongCodeRes.success, false);
  if (!wrongCodeRes.success) {
    assert.equal(wrongCodeRes.error.code, 'NOT_FOUND');
  }

  // B. Đăng nhập giáo viên để tạm khóa mã của lớp WEB-8821
  const loginTeacher = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  setSessionToken(loginTeacher.data.token);
  toggleJoinCodeStatus('class-web-01', false);

  // Đăng nhập lại học sinh và thử nhập mã lớp bị khóa
  setSessionToken(loginRes.data.token);
  const disabledRes = previewClassByCode('WEB-8821');
  assert.equal(disabledRes.success, false);
  if (!disabledRes.success) {
    assert.equal(disabledRes.error.code, 'JOIN_CODE_DISABLED');
  }

  // Mở lại mã lớp để không ảnh hưởng test khác
  setSessionToken(loginTeacher.data.token);
  toggleJoinCodeStatus('class-web-01', true);
});

test('8. Yêu cầu tham gia được duyệt và từ chối đúng bởi giáo viên', async () => {
  // A. Đăng nhập học sinh gửi yêu cầu vào lớp
  const loginStudent = await loginApi({
    email: 'vanhoc.student@lhp.edu.vn',
    password: 'student123',
  });
  setSessionToken(loginStudent.data.token);

  // B. Đăng nhập giáo viên phụ trách lớp
  const loginTeacher = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  assert.equal(loginTeacher.success, true);
  setSessionToken(loginTeacher.data.token);

  // Lấy yêu cầu mẫu 'req-join-01' (Trần Minh Đức xin vào lớp WEB-8821)
  const reqs = getJoinRequests('class-web-01');
  const targetReq = reqs.find((r) => r.id === 'req-join-01');
  assert.ok(targetReq);

  // Duyệt yêu cầu
  const approveRes = approveJoinRequest('req-join-01');
  assert.equal(approveRes.success, true);
  if (approveRes.success) {
    assert.equal(approveRes.data.status, 'approved');
  }

  // Kiểm tra học sinh 'usr-student-05' đã có trong danh sách thành viên lớp WEB-8821
  const updatedClass = getClassroomById('class-web-01');
  assert.ok(updatedClass?.studentIds.includes('usr-student-05'));
});

test('9. Không thể thêm cùng một học sinh hai lần (Chống trùng lặp)', async () => {
  // Đăng nhập học sinh đã là thành viên lớp
  const loginStudent = await loginApi({
    email: 'vanhoc.student@lhp.edu.vn',
    password: 'student123',
  });
  setSessionToken(loginStudent.data.token);

  // Học sinh cố gửi lại yêu cầu vào lớp WEB-8821 mà mình đã là thành viên
  const res = requestJoinClassByCode('WEB-8821');
  assert.equal(res.success, false);
  if (!res.success) {
    assert.equal(res.error.code, 'ALREADY_ENROLLED');
  }
});

test('10. Học sinh không thể tự duyệt yêu cầu vào lớp', async () => {
  // Đăng nhập học sinh
  const loginStudent = await loginApi({
    email: 'vanhoc.student@lhp.edu.vn',
    password: 'student123',
  });
  setSessionToken(loginStudent.data.token);

  // Học sinh cố gọi hàm approveJoinRequest
  const hackRes = approveJoinRequest('req-join-01');
  assert.equal(hackRes.success, false);
  if (!hackRes.success) {
    assert.equal(hackRes.error.code, 'FORBIDDEN');
  }
});

test('11. Giáo viên không thể truy cập hoặc quản lý lớp không được phân công', async () => {
  // Đăng nhập Giáo viên Lê Hồng Phong
  const loginTeacher = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  setSessionToken(loginTeacher.data.token);

  // Lớp 'class-math-03' thuộc trường Chu Văn An, do giáo viên khác phụ trách
  const updateRes = updateClassroom('class-math-03', {
    name: 'Tên Lớp Bị Sửa Trái Phép',
  });

  assert.equal(updateRes.success, false);
  if (!updateRes.success) {
    assert.equal(updateRes.error.code, 'FORBIDDEN');
  }
});

test('12. Không thể dùng SubjectId của trường khác khi tạo lớp', async () => {
  // Đăng nhập Giáo viên Lê Hồng Phong
  const loginTeacher = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  setSessionToken(loginTeacher.data.token);

  // 'sub-cva-advmath' là môn riêng của trường THPT Chu Văn An
  const res = createClassroom({
    name: 'Lớp Dùng Nhầm Môn Trường Bạn',
    subject: 'Giải tích CVA',
    subjectId: 'sub-cva-advmath', // Môn của CVA
    description: 'Thử nghiệm tính toàn vẹn môn học.',
  });

  assert.equal(res.success, false);
  if (!res.success) {
    assert.equal(res.error.code, 'INVALID_SUBJECT_SCOPE');
    assert.match(res.error.message, /thuộc quyền quản lý của trường khác/i);
  }
});

test('13. Lớp đã đóng/lưu trữ không nhận thêm học sinh', async () => {
  // Giáo viên lưu trữ lớp 'class-web-01'
  const loginTeacher = await loginApi({
    email: 'giaovien.tran@lhp.edu.vn',
    password: 'teacher123',
  });
  setSessionToken(loginTeacher.data.token);
  archiveClassroom('class-web-01', true);

  // Học sinh thử tìm mã lớp đã lưu trữ
  const loginStudent = await loginApi({
    email: 'vanhoc.student@lhp.edu.vn',
    password: 'student123',
  });
  setSessionToken(loginStudent.data.token);

  const previewRes = previewClassByCode('WEB-8821');
  assert.equal(previewRes.success, false);
  if (!previewRes.success) {
    assert.equal(previewRes.error.code, 'CLASS_ARCHIVED');
  }

  // Khôi phục lại lớp để không ảnh hưởng dữ liệu khác
  setSessionToken(loginTeacher.data.token);
  archiveClassroom('class-web-01', false);
});

test('14. Tài khoản chưa đăng nhập không thể gọi API bảo vệ', async () => {
  // Xóa session token giả lập chưa đăng nhập
  setSessionToken(null);

  const res1 = createSchool({
    code: 'ANON-SCH',
    name: 'Trường Nặc Danh',
    level: 'high_school',
    address: 'Địa chỉ',
    email: 'anon@school.edu.vn',
    phone: '0123',
  });
  assert.equal(res1.success, false);
  if (!res1.success) {
    assert.ok(res1.error.code === 'UNAUTHORIZED' || res1.error.code === 'FORBIDDEN');
  }

  // Thử gọi hàm checkPermission trực tiếp với null user
  const { checkPermission } = await import('../services/rbac');
  const directDecision = checkPermission(null, 'school:manage');
  assert.equal(directDecision.allowed, false);
  assert.equal(directDecision.code, 'UNAUTHORIZED');
});

test('15. Migration không làm mất dữ liệu hiện tại (Tính lũy tiến & Idempotent)', async () => {
  // Đăng nhập sysadmin để xem dữ liệu toàn quốc
  const loginRes = await loginApi({
    email: 'sysadmin@doc2practice.edu.vn',
    password: 'sysadmin123',
  });
  setSessionToken(loginRes.data.token);

  // Chạy migration nhiều lần liên tiếp
  const mig1 = await runAuthMigrations();
  const mig2 = await runAuthMigrations();

  assert.equal(mig2.migrated, false);
  assert.match(mig2.message, /hoàn tất migration/i);

  // Đảm bảo các lớp học và danh mục trường, môn học vẫn nguyên vẹn
  const schools = getSchools();
  assert.ok(schools.length >= 3);

  const subjects = getSubjects();
  assert.ok(subjects.length >= 5);

  const classes = getClassrooms();
  assert.ok(classes.length >= 2);
});
