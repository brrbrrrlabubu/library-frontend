import { http, TOKEN_KEY, USER_KEY } from './http';
import { mockApi } from './mock';
import type {
  AuthResponse,
  Book,
  BookInput,
  Category,
  DashboardStats,
  Loan,
  LoanInput,
  StudentInput,
  User,
  CategoryInput,
  StudentLoansResponse,
  DebtorSummary,
} from '../types';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
const data = <T>(promise: Promise<{ data: T }>) => promise.then((response) => response.data);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const result = USE_MOCKS
      ? await mockApi.login(email, password)
      : await data(http.post<AuthResponse>('/auth/login', { email, password }));
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return result;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  changePassword: (currentPassword: string, newPassword: string) => {
    if (!USE_MOCKS)
      return data(http.post<void>('/auth/change-password', { currentPassword, newPassword }));
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null;
    if (!user) return Promise.reject(new Error('Сессия не найдена'));
    return mockApi.changePassword(user.id, currentPassword, newPassword);
  },
};

type BookPageResponse = {
  items: Book[];
  total?: number;
  page?: number;
  totalPages?: number;
};

async function getAllBooksFromApi(): Promise<Book[]> {
  const limit = 100;
  const firstPage = await data(
    http.get<BookPageResponse | Book[]>('/books', { params: { page: 1, limit } }),
  );

  // Accept a non-paginated response for backends that return the complete array.
  if (Array.isArray(firstPage)) return firstPage;
  if (!firstPage || !Array.isArray(firstPage.items)) {
    throw new Error('Сервер вернул каталог книг в неизвестном формате');
  }

  const totalPages =
    Number.isInteger(firstPage.totalPages) && (firstPage.totalPages ?? 0) > 0
      ? (firstPage.totalPages as number)
      : typeof firstPage.total === 'number'
        ? Math.max(1, Math.ceil(firstPage.total / limit))
        : 1;

  const books = [...firstPage.items];
  for (let page = 2; page <= totalPages; page += 1) {
    const result = await data(
      http.get<BookPageResponse | Book[]>('/books', { params: { page, limit } }),
    );
    if (Array.isArray(result)) {
      books.push(...result);
      break;
    }
    if (!result || !Array.isArray(result.items)) {
      throw new Error(`Сервер вернул некорректные данные каталога на странице ${page}`);
    }
    books.push(...result.items);
  }

  return books;
}

export const libraryService = {
  getBooks: (
    params: {
      search?: string;
      categoryId?: string;
      sort?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    USE_MOCKS
      ? mockApi.getBooks(params)
      : data(
          http.get<{ items: Book[]; total: number; page: number; totalPages: number }>('/books', {
            params,
          }),
        ),
  getAllBooks: () => (USE_MOCKS ? mockApi.getAllBooks() : getAllBooksFromApi()),
  getBook: (id: string) =>
    USE_MOCKS ? mockApi.getBook(id) : data(http.get<Book>(`/books/${encodeURIComponent(id)}`)),
  getBookByQr: (code: string) =>
    USE_MOCKS
      ? mockApi.getBook(code)
      : data(http.get<Book>(`/books/qr/${encodeURIComponent(code)}`)),
  getCategories: () =>
    USE_MOCKS ? mockApi.getCategories() : data(http.get<Category[]>('/categories')),
  saveBook: (input: BookInput) => {
    if (USE_MOCKS) return mockApi.saveBook(input);
    if (input.coverFile || input.pdfFile) {
      const body = new FormData();
      Object.entries(input).forEach(([key, value]) => {
        if (value === undefined || ['id', 'availableCopies', 'createdAt'].includes(key)) return;
        body.append(key, value instanceof File ? value : String(value));
      });
      // Let Axios/the browser attach the multipart boundary automatically.
      return input.id
        ? data(http.put<Book>(`/books/${encodeURIComponent(input.id)}`, body))
        : data(http.post<Book>('/books', body));
    }
    const payload = {
      code: input.code,
      title: input.title,
      author: input.author,
      categoryId: input.categoryId,
      description: input.description,
      cover: input.cover,
      pdfUrl: input.pdfUrl,
      totalCopies: input.totalCopies,
      ...(input.popular === undefined ? {} : { popular: input.popular }),
    };
    const id = input.id;
    return id
      ? data(http.put<Book>(`/books/${encodeURIComponent(id)}`, payload))
      : data(http.post<Book>('/books', payload));
  },
  deleteBook: (id: string) =>
    USE_MOCKS
      ? mockApi.deleteBook(id)
      : data(http.delete<void>(`/books/${encodeURIComponent(id)}`)),
  saveCategory: (input: CategoryInput) =>
    USE_MOCKS
      ? mockApi.saveCategory(input)
      : input.id
        ? data(http.put<Category>(`/categories/${encodeURIComponent(input.id)}`, input))
        : data(http.post<Category>('/categories', input)),
  deleteCategory: (id: string) =>
    USE_MOCKS
      ? mockApi.deleteCategory(id)
      : data(http.delete<void>(`/categories/${encodeURIComponent(id)}`)),
};

export const adminService = {
  getDashboard: () =>
    USE_MOCKS ? mockApi.getDashboard() : data(http.get<DashboardStats>('/admin/dashboard')),
  getStudents: () =>
    USE_MOCKS ? mockApi.getStudents() : data(http.get<User[]>('/admin/students')),
  saveStudent: (input: StudentInput) =>
    USE_MOCKS ? mockApi.saveStudent(input) : data(http.post<User>('/admin/students', input)),
  toggleStudent: (id: string) =>
    USE_MOCKS
      ? mockApi.toggleStudent(id)
      : data(http.patch<User>(`/admin/students/${encodeURIComponent(id)}/block`)),
  getLoans: () => (USE_MOCKS ? mockApi.getLoans() : data(http.get<Loan[]>('/admin/loans'))),
  getDebtors: () =>
    USE_MOCKS ? mockApi.getDebtors() : data(http.get<DebtorSummary[]>('/admin/debtors')),
  issueLoan: (input: LoanInput) =>
    USE_MOCKS ? mockApi.issueLoan(input) : data(http.post<Loan>('/admin/loans', input)),
  returnLoan: (id: string) =>
    USE_MOCKS
      ? mockApi.returnLoan(id)
      : data(http.post<Loan>(`/admin/loans/${encodeURIComponent(id)}/return`)),
  payFine: (id: string) =>
    USE_MOCKS
      ? mockApi.payFine(id)
      : data(http.patch<Loan>(`/admin/loans/${encodeURIComponent(id)}/pay-fine`)),
};

export const studentService = {
  getMyLoans: async (): Promise<StudentLoansResponse> => {
    if (USE_MOCKS) return mockApi.getMyLoans();
    const response = await data(http.get<StudentLoansResponse | Loan[]>('/loans/my'));
    return Array.isArray(response) ? { items: response } : response;
  },
};
