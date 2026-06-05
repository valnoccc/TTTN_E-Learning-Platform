import { UserRole } from '../../modules/users/entities/user.entity';

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  GIANG_VIEN: UserRole.INSTRUCTOR,
  GV: UserRole.INSTRUCTOR,
  HOC_VIEN: UserRole.STUDENT,
  HV: UserRole.STUDENT,
};

export function normalizeRole(role?: string | null): UserRole {
  if (!role) return UserRole.STUDENT;
  const normalized = role.trim().toUpperCase();
  return LEGACY_ROLE_MAP[normalized] ?? normalized;
}
