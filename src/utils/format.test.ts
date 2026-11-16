import { describe, expect, it } from 'vitest';
import { booksLabel, formatMoney, loanDueState, loansLabel, pluralRu } from './format';

describe('loanDueState', () => {
  it('marks returned loans as completed', () => {
    expect(
      loanDueState({ status: 'RETURNED', returnedAt: '2025-01-02T00:00:00.000Z' }).className,
    ).toBe('success');
  });

  it('marks a past due date as overdue', () => {
    expect(loanDueState({ status: 'OVERDUE', daysRemaining: -5 }).className).toBe('danger');
  });

  it('marks a negative daysRemaining as overdue even while status is still ACTIVE', () => {
    expect(loanDueState({ status: 'ACTIVE', daysRemaining: -1 })).toMatchObject({
      label: 'Просрочено',
      className: 'danger',
    });
  });

  it('warns when three days or less remain', () => {
    expect(loanDueState({ status: 'ACTIVE', daysRemaining: 2 }).className).toBe('warning');
    expect(loanDueState({ status: 'ACTIVE', daysRemaining: 0 }).label).toBe('Вернуть сегодня');
  });

  it('shows on-time loans in green', () => {
    expect(loanDueState({ status: 'ACTIVE', daysRemaining: 9 }).label).toBe('В срок');
  });
});

describe('pluralRu', () => {
  it('selects the correct Russian plural form', () => {
    expect(pluralRu(1, ['книга', 'книги', 'книг'])).toBe('книга');
    expect(pluralRu(2, ['книга', 'книги', 'книг'])).toBe('книги');
    expect(pluralRu(5, ['книга', 'книги', 'книг'])).toBe('книг');
    expect(pluralRu(11, ['книга', 'книги', 'книг'])).toBe('книг');
    expect(pluralRu(21, ['книга', 'книги', 'книг'])).toBe('книга');
    expect(pluralRu(12, ['выдача', 'выдачи', 'выдач'])).toBe('выдач');
  });

  it('builds ready-to-render labels', () => {
    expect(booksLabel(3)).toBe('3 книги');
    expect(loansLabel(1)).toBe('1 выдача');
  });
});

describe('formatMoney', () => {
  it('formats amounts in Kyrgyz som', () => {
    expect(formatMoney(100)).toContain('100');
    expect(formatMoney(100)).toContain('сом');
  });
});
