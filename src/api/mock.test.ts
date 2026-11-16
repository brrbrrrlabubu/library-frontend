import { describe, expect, it } from 'vitest';
import { mockApi } from './mock';

// Regression: `loans.map(mockLoanSnapshot)` used to forward the array index as
// the `now` argument, so demo loans were never recognized as overdue.
describe('mockApi loan snapshots', () => {
  it('reports the seeded overdue loan as OVERDUE', async () => {
    const loans = await mockApi.getLoans();
    expect(loans.some((loan) => loan.status === 'OVERDUE')).toBe(true);
  });

  it('keeps daysRemaining within a sane range instead of epoch day counts', async () => {
    const loans = await mockApi.getLoans();
    for (const loan of loans) {
      if (typeof loan.daysRemaining === 'number') {
        expect(Math.abs(loan.daysRemaining)).toBeLessThan(365 * 5);
      }
    }
  });

  it('marks the overdue demo loan as a debtor with an unpaid fine', async () => {
    const debtors = await mockApi.getDebtors();
    expect(debtors.length).toBeGreaterThan(0);
    expect(debtors[0].unpaidFineTotal).toBeGreaterThan(0);
  });
});
