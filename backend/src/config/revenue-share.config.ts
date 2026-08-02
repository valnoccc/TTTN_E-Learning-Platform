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

function readPercent(value: string | undefined, fieldName: string) {
  if (value === undefined || value.trim() === '') {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${fieldName} must be a number between 0 and 100.`);
  }
  return parsed;
}

export function getRevenueShareConfig(env: RevenueShareEnv = process.env): RevenueShareConfig {
  const instructorPercent = readPercent(
    env.INSTRUCTOR_REVENUE_PERCENT,
    'INSTRUCTOR_REVENUE_PERCENT',
  );
  const adminPercent = readPercent(
    env.ADMIN_REVENUE_PERCENT,
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
