import type { AuditLog, UserRole } from '../types';

const AUDIT_STORAGE_KEY = 'd2p_audit_logs_v1';
const MAX_LOG_ENTRIES = 500;

export const initAuditStorage = (): void => {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(AUDIT_STORAGE_KEY)) {
    const initialLogs: AuditLog[] = [
      {
        id: 'log-init-01',
        timestamp: new Date().toISOString(),
        actorId: 'usr-sysadmin-01',
        actorEmail: 'sysadmin@doc2practice.edu.vn',
        actorRole: 'system_admin',
        action: 'LOGIN_SUCCESS',
        targetType: 'system',
        details: 'Khởi tạo hệ thống kiểm soát xác thực và phân quyền',
        status: 'success',
      },
    ];
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialLogs));
  }
};

/**
 * Ghi nhật ký bảo mật và hành động quản trị quan trọng
 */
export const recordAuditLog = (params: {
  actorId: string;
  actorEmail: string;
  actorRole: UserRole | 'anonymous';
  action: AuditLog['action'];
  targetType: AuditLog['targetType'];
  targetId?: string;
  schoolId?: string;
  details: string;
  status: 'success' | 'failure';
}): AuditLog => {
  initAuditStorage();
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    ...params,
  };

  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AUDIT_STORAGE_KEY) : null;
    const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(newLog);
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.length = MAX_LOG_ENTRIES;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('audit_log_added', { detail: newLog }));
    }
  } catch {
    // ignore
  }

  return newLog;
};

/**
 * Lấy danh sách nhật ký kiểm toán (Có phân quyền theo trường học)
 */
export const getAuditLogs = (filter?: {
  schoolId?: string;
  actorRole?: UserRole;
  action?: string;
}): AuditLog[] => {
  initAuditStorage();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AUDIT_STORAGE_KEY) : null;
    let list: AuditLog[] = raw ? JSON.parse(raw) : [];

    if (filter?.schoolId) {
      list = list.filter((l) => !l.schoolId || l.schoolId === filter.schoolId);
    }
    if (filter?.actorRole) {
      list = list.filter((l) => l.actorRole === filter.actorRole);
    }
    if (filter?.action) {
      list = list.filter((l) => l.action === filter.action);
    }
    return list;
  } catch {
    return [];
  }
};
