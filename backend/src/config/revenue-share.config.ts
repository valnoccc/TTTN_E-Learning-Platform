export interface RevenueShareConfig {
  instructorPercent: number;
  adminPercent: number;
  instructorShare: number;
  adminShare: number;
}

type RevenueShareEnv = {
  INSTRUCTOR_REVENUE_PERCENT?: string;
  ADMIN_REVENUE_PERCENT?: string;
};

const DEFAULT_INSTRUCTOR_PERCENT = 80;
const DEFAULT_ADMIN_PERCENT = 20;

function readPercent(value: string | undefined, fallback: number, fieldName: string) {
  const parsed = value === undefined || value.trim() === '' ? fallback : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${fieldName} must be a number between 0 and 100.`);
  }
  return parsed;
}

export function getRevenueShareConfig(env: RevenueShareEnv = process.env): RevenueShareConfig {
  const instructorPercent = readPercent(
    env.INSTRUCTOR_REVENUE_PERCENT,
    DEFAULT_INSTRUCTOR_PERCENT,
    'INSTRUCTOR_REVENUE_PERCENT',
  );
  const adminPercent = readPercent(
    env.ADMIN_REVENUE_PERCENT,
    DEFAULT_ADMIN_PERCENT,
    'ADMIN_REVENUE_PERCENT',
  );

  if (instructorPercent + adminPercent !== 100) {
    throw new Error('INSTRUCTOR_REVENUE_PERCENT and ADMIN_REVENUE_PERCENT must total 100.');
  }

  return {
    instructorPercent,
    adminPercent,
    instructorShare: instructorPercent / 100,
    adminShare: adminPercent / 100,
  };
}
