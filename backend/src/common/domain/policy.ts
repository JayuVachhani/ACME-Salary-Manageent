export const permissions = ['read', 'write', 'edit', 'delete', 'salary:view', 'export'] as const;
export type Permission = (typeof permissions)[number];
export type Principal = {
  id: string;
  employeeId: string | null;
  isHrManager: boolean;
  active: boolean;
  isSystem: boolean;
  permissions: readonly Permission[];
};

export function can(principal: Principal, permission: Permission): boolean {
  if (!principal.active || principal.isSystem) return false;
  return principal.isHrManager || principal.permissions.includes(permission);
}

export function canChangeSalary(principal: Principal, employeeId: string): boolean {
  return (
    can(principal, 'read') &&
    can(principal, 'edit') &&
    can(principal, 'salary:view') &&
    principal.employeeId !== null &&
    principal.employeeId !== employeeId
  );
}

export function canExportSalary(principal: Principal): boolean {
  return can(principal, 'read') && can(principal, 'salary:view') && can(principal, 'export');
}

export function canManageUser(principal: Principal, targetId: string): boolean {
  return (
    principal.active && !principal.isSystem && principal.isHrManager && principal.id !== targetId
  );
}
