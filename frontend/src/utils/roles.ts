export type CanonicalRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

const LEGACY_ROLE_MAP: Record<string, CanonicalRole> = {
  GIANG_VIEN: 'INSTRUCTOR',
  GV: 'INSTRUCTOR',
  HOC_VIEN: 'STUDENT',
  HV: 'STUDENT',
};

export function normalizeRole(role?: string | null): CanonicalRole | undefined {
  if (!role) return undefined;
  const trimmed = role.trim().toUpperCase();
  return (LEGACY_ROLE_MAP[trimmed] ?? trimmed) as CanonicalRole;
}
