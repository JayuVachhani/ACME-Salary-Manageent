export type Reference = { id: string; name: string; is_active: boolean; version: number };
export type Kind = 'departments' | 'designations';
export type PendingReference = {
  kind: Kind;
  name: string;
  isActive: boolean;
  editing: Reference | null;
};
