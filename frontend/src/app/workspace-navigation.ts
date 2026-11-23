import { useSyncExternalStore } from 'react';
export const workspacePages = [
  {
    id: 'home',
    label: 'Home',
    description: 'Choose what you would like to do today.',
    symbol: '⌂',
    managerOnly: false,
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Find an employee and view their details.',
    symbol: 'E',
    managerOnly: false,
  },
  {
    id: 'add-employee',
    label: 'Add employee',
    description: 'Add employee details and request approval for their initial salary.',
    symbol: '+',
    managerOnly: false,
  },
  {
    id: 'salaries',
    label: 'Salary workspace',
    description: 'Find current salaries, scheduled changes and requests in one place.',
    symbol: '₹',
    managerOnly: false,
  },
  {
    id: 'salary-bulk',
    label: 'Bulk salary revisions',
    description: 'Upload exact salary revisions and review each employee before saving.',
    symbol: 'B',
    managerOnly: false,
  },
  {
    id: 'payroll-drafts',
    label: 'Payroll drafts',
    description: 'Enter monthly components and prepare draft payslips.',
    symbol: 'P',
    managerOnly: true,
  },
  {
    id: 'salary-approvals',
    label: 'Salary approvals',
    description: 'Review initial salaries and requests awaiting an independent decision.',
    symbol: 'S',
    managerOnly: true,
  },
  {
    id: 'organization',
    label: 'Departments & job titles',
    description: 'Keep your department and job title lists up to date.',
    symbol: 'D',
    managerOnly: true,
  },
  {
    id: 'team',
    label: 'Team access',
    description: 'Invite colleagues and choose what they can access.',
    symbol: 'T',
    managerOnly: true,
  },
  {
    id: 'countries',
    label: 'Countries & currencies',
    description: 'Manage the countries and currencies your organization uses.',
    symbol: 'C',
    managerOnly: false,
  },
  {
    id: 'exchange-rates',
    label: 'Exchange rates',
    description: 'View currency conversion rates and their history.',
    symbol: 'R',
    managerOnly: false,
  },
] as const;
function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
/** Browser-native page links support refresh, bookmarks and back/forward. */
export function useWorkspaceLocation() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1) || '/home',
    () => '/home',
  );
}
export const workspaceGroups = [
  { label: 'Overview', pages: ['home'] },
  { label: 'People', pages: ['employees', 'add-employee'] },
  {
    label: 'Salary',
    pages: ['salaries', 'salary-bulk', 'salary-approvals', 'exchange-rates'],
  },
  {
    label: 'Payroll',
    pages: ['payroll-drafts'],
  },
  { label: 'Settings', pages: ['organization', 'countries', 'team'] },
] as const;
