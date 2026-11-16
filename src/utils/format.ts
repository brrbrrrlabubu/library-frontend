export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  );
export const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-KG', {
    style: 'currency',
    currency: 'KGS',
    maximumFractionDigits: 0,
  }).format(value);

/** Russian plural: forms is [one, few, many], e.g. ['книга', 'книги', 'книг']. */
export function pluralRu(count: number, forms: [string, string, string]): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const booksLabel = (count: number) =>
  `${count} ${pluralRu(count, ['книга', 'книги', 'книг'])}`;
export const loansLabel = (count: number) =>
  `${count} ${pluralRu(count, ['выдача', 'выдачи', 'выдач'])}`;

export function loanDueState(loan: {
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  returnedAt?: string;
  daysRemaining?: number;
}) {
  if (loan.status === 'RETURNED' || loan.returnedAt)
    return { label: 'Возвращена', className: 'success' };
  if (loan.status === 'OVERDUE') return { label: 'Просрочено', className: 'danger' };
  if (typeof loan.daysRemaining === 'number') {
    // The deadline has already passed even though the server still reports ACTIVE.
    if (loan.daysRemaining < 0) return { label: 'Просрочено', className: 'danger' };
    if (loan.daysRemaining <= 3)
      return {
        label: loan.daysRemaining === 0 ? 'Вернуть сегодня' : `Осталось ${loan.daysRemaining} дн.`,
        className: 'warning',
      };
  }
  return { label: 'В срок', className: 'success' };
}
