import { describe, expect, it } from 'vitest';
import { groupDebtorsByStudent, mockLoanSnapshot } from './loans';
import type { Loan } from '../types';

const makeLoan = (overrides: Partial<Loan>): Loan => ({
  id: 'loan-1',
  studentId: 'student-1',
  bookId: 'book-1',
  issuedAt: '2026-10-01T00:00:00.000Z',
  dueAt: '2026-10-10T00:00:00.000Z',
  fine: 0,
  finePaid: false,
  status: 'ACTIVE',
  ...overrides,
});

describe('groupDebtorsByStudent', () => {
  it('returns one row per student and sums only unpaid server-calculated fines', () => {
    const result = groupDebtorsByStudent([
      makeLoan({ id: 'a', fine: 120, status: 'OVERDUE' }),
      makeLoan({ id: 'b', fine: 80, status: 'RETURNED' }),
      makeLoan({ id: 'c', studentId: 'student-2', fine: 50, finePaid: true, status: 'RETURNED' }),
      makeLoan({ id: 'd', studentId: 'student-3', fine: 0, status: 'ACTIVE' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ studentId: 'student-1', unpaidFineTotal: 200 });
    expect(result[0].loans.map((loan) => loan.id)).toEqual(['a', 'b']);
  });

  it('includes overdue loans even before a fine is charged', () => {
    const result = groupDebtorsByStudent([makeLoan({ status: 'OVERDUE', fine: 0 })]);

    expect(result).toHaveLength(1);
    expect(result[0].unpaidFineTotal).toBe(0);
  });
});

describe('mockLoanSnapshot', () => {
  const now = Date.parse('2026-11-02T10:00:00.000Z');

  it('marks a deadline as overdue as soon as it has passed, even when less than one day late', () => {
    const loan = makeLoan({ dueAt: '2026-11-02T09:59:59.000Z', status: 'ACTIVE' });

    expect(mockLoanSnapshot(loan, now)).toMatchObject({
      status: 'OVERDUE',
      daysRemaining: 0,
    });
  });

  it('keeps a loan active at the exact deadline instant', () => {
    const loan = makeLoan({ dueAt: '2026-11-02T10:00:00.000Z', status: 'ACTIVE' });

    expect(mockLoanSnapshot(loan, now)).toMatchObject({
      status: 'ACTIVE',
      daysRemaining: 0,
    });
  });
});
