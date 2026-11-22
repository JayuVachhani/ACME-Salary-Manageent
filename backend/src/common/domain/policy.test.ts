import { describe, expect, it } from 'vitest';
import {
  can,
  canChangeSalary,
  canExportSalary,
  canManageUser,
  permissions,
  type Principal,
} from './policy';
const base: Principal = {
  id: 'synthetic-user',
  employeeId: 'synthetic-employee',
  active: true,
  isSystem: false,
  isHrManager: false,
  permissions: ['read'],
};

describe('approved permission boundaries', () => {
  it('read does not grant compensation or export access', () => {
    expect(can(base, 'salary:view')).toBe(false);
    expect(canExportSalary(base)).toBe(false);
  });
  it('keeps create and edit distinct', () => {
    expect(can({ ...base, permissions: ['read', 'write'] }, 'edit')).toBe(false);
    expect(can({ ...base, permissions: ['read', 'edit'] }, 'write')).toBe(false);
  });
  it('requires every export prerequisite', () => {
    for (const missing of ['read', 'salary:view', 'export'] as const) {
      expect(
        canExportSalary({ ...base, permissions: permissions.filter((p) => p !== missing) }),
      ).toBe(false);
    }
    expect(canExportSalary({ ...base, permissions })).toBe(true);
  });
  it('blocks self-salary changes even for HR Managers', () => {
    const manager = { ...base, isHrManager: true };
    expect(canChangeSalary(manager, 'synthetic-employee')).toBe(false);
    expect(canChangeSalary(manager, 'other-synthetic-employee')).toBe(true);
    expect(canManageUser(manager, manager.id)).toBe(false);
    expect(canManageUser(manager, 'other-user')).toBe(true);
  });
  it('never authorizes inactive or system users, even with manager flag', () => {
    for (const override of [{ active: false }, { isSystem: true }]) {
      const actor = { ...base, isHrManager: true, ...override };
      for (const permission of permissions) expect(can(actor, permission)).toBe(false);
      expect(canManageUser(actor, 'other-user')).toBe(false);
    }
  });
});
