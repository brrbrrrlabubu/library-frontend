import type { DebtorSummary, Loan } from '../types';

/**
 * Mock-only loan projection. In the real application, the backend owns the
 * loan status and remaining-day calculation and the frontend only displays it.
 */
export function mockLoanSnapshot(loan: Loan, now = Date.now()): Loan {
  if (loan.status === 'RETURNED') return { ...loan, daysRemaining: undefined };

  const dueAt = Date.parse(loan.dueAt);
  if (!Number.isFinite(dueAt)) return { ...loan, daysRemaining: undefined };

  const daysRemaining = Math.ceil((dueAt - now) / 86400000);
  return {
    ...loan,
    // Math.ceil of a small negative fraction yields -0; normalize it to plain 0.
    daysRemaining: daysRemaining === 0 ? 0 : daysRemaining,
    // Do not wait for the next midnight to mark an already-passed deadline overdue.
    status: dueAt < now ? 'OVERDUE' : 'ACTIVE',
  };
}

/** Groups server-reported overdue loans and unpaid fines by student for admin reporting. */
export function groupDebtorsByStudent(loans: Loan[]): DebtorSummary[] {
  const grouped = new Map<string, Loan[]>();

  for (const loan of loans) {
    const isDebtor = loan.status === 'OVERDUE' || (loan.fine > 0 && !loan.finePaid);
    if (!isDebtor) continue;

    const studentLoans = grouped.get(loan.studentId) ?? [];
    studentLoans.push(loan);
    grouped.set(loan.studentId, studentLoans);
  }

  return [...grouped.entries()]
    .map(([studentId, studentLoans]) => ({
      studentId,
      loans: studentLoans,
      unpaidFineTotal: studentLoans
        .filter((loan) => !loan.finePaid)
        .reduce((total, loan) => total + loan.fine, 0),
    }))
    .sort((left, right) => right.unpaidFineTotal - left.unpaidFineTotal);
}
