export type Role = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  group?: string;
  blocked?: boolean;
}

export interface Book {
  id: string;
  code: string;
  title: string;
  author: string;
  categoryId: string;
  description: string;
  cover: string;
  pdfUrl: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  popular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}
export type CategoryInput = Omit<Category, 'id'> & { id?: string };

export interface Loan {
  id: string;
  studentId: string;
  bookId: string;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string;
  fine: number;
  finePaid: boolean;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  daysRemaining?: number;
}

export interface DashboardStats {
  totalBooks: number;
  activeLoans: number;
  debtors: number;
  unpaidFines: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/** Server-calculated summary returned by GET /loans/my. */
export interface StudentLoansResponse {
  items: Loan[];
  unpaidFineTotal?: number;
}

export interface DebtorSummary {
  studentId: string;
  loans: Loan[];
  unpaidFineTotal: number;
}
export interface BookInput extends Omit<Book, 'id' | 'availableCopies' | 'createdAt'> {
  id?: string;
  availableCopies?: number;
  createdAt?: string;
  coverFile?: File;
  pdfFile?: File;
}
export interface StudentInput {
  fullName: string;
  email: string;
  group: string;
  password: string;
}
export interface LoanInput {
  studentId: string;
  bookId: string;
  days: number;
}
