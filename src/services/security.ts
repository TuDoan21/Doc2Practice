import type { UserProfile } from './auth';
import type { UserRecord } from '../types';

/**
 * Module bảo mật & mã hóa dành cho Doc2Practice
 * Sử dụng chuẩn Web Crypto API (SubtleCrypto) tương thích cả trình duyệt và Node.js.
 * Tuyệt đối không lưu trữ hoặc trả về mật khẩu dạng văn bản thô.
 */

const PEPPER = 'd2p_edu_security_pepper_2026';

/**
 * Sinh chuỗi salt ngẫu nhiên bằng bộ sinh số ngẫu nhiên an toàn (CSPRNG)
 */
export const generateSalt = (bytesCount = 16): string => {
  const array = new Uint8Array(bytesCount);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Băm mật khẩu sử dụng SHA-256 kết hợp per-user salt và secret pepper
 */
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const enc = new TextEncoder();
  const payload = enc.encode(`${salt}:${password}:${PEPPER}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', payload);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Xác thực mật khẩu nhập vào so với mã băm lưu trong cơ sở dữ liệu
 */
export const verifyPassword = async (
  plainPassword: string,
  salt: string,
  storedHash: string
): Promise<boolean> => {
  const computedHash = await hashPassword(plainPassword, salt);
  return computedHash === storedHash;
};

/**
 * Sinh token phiên hoặc token đặt lại mật khẩu an toàn
 */
export const generateCryptoToken = (prefix = 'tok', bytesCount = 24): string => {
  const array = new Uint8Array(bytesCount);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${hex}`;
};

/**
 * Loại bỏ toàn bộ trường nhạy cảm (mật khẩu, salt, token nội bộ) trước khi trả về client/API
 */
export const sanitizeUser = (user: UserRecord | UserProfile): UserProfile => {
  const clone = { ...user } as any;
  delete clone.passwordHash;
  delete clone.passwordSalt;
  delete clone.failedLoginAttempts;
  delete clone.lockedUntil;
  return clone as UserProfile;
};

/**
 * Ẩn một phần email để hiển thị an toàn (VD: tr***@lhp.edu.vn)
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
};
