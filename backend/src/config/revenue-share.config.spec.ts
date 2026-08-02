import { getRevenueShareConfig } from './revenue-share.config';

describe('getRevenueShareConfig', () => {
  it('reads configurable percentages and converts them to ratios', () => {
    expect(
      getRevenueShareConfig({
        INSTRUCTOR_REVENUE_PERCENT: '75',
        ADMIN_REVENUE_PERCENT: '25',
      }),
    ).toEqual({
      instructorPercent: 75,
      adminPercent: 25,
      instructorShare: 0.75,
      adminShare: 0.25,
    });
  });

  it('requires both revenue percentages to be provided by the environment', () => {
    expect(() => getRevenueShareConfig({})).toThrow(
      'INSTRUCTOR_REVENUE_PERCENT is required.',
    );
  });

  it('rejects invalid or unbalanced percentages', () => {
    expect(() => getRevenueShareConfig({ INSTRUCTOR_REVENUE_PERCENT: '80', ADMIN_REVENUE_PERCENT: '10' })).toThrow();
    expect(() => getRevenueShareConfig({ INSTRUCTOR_REVENUE_PERCENT: 'abc', ADMIN_REVENUE_PERCENT: '20' })).toThrow();
  });
});
