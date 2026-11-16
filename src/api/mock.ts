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
} from '../types';
import { groupDebtorsByStudent, mockLoanSnapshot } from '../utils/loans';
import { USER_KEY } from './http';

const DB_KEY = 'library_mock_db_v2';
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const demoBooks: Book[] = [
  {
    id: 'b1',
    code: 'LIB-001',
    title: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    categoryId: 'c1',
    description:
      'Роман о Москве 1930-х годов, загадочном визите Воланда и истории любви, верности и творчества.',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
    pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    totalCopies: 8,
    availableCopies: 7,
    createdAt: iso(12),
    popular: true,
  },
  {
    id: 'b2',
    code: 'LIB-002',
    title: 'Чистый код',
    author: 'Роберт Мартин',
    categoryId: 'c2',
    description:
      'Практическое руководство по написанию понятного, поддерживаемого и профессионального программного кода.',
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600',
    pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    totalCopies: 5,
    availableCopies: 4,
    createdAt: iso(8),
    popular: true,
  },
  {
    id: 'b3',
    code: 'LIB-003',
    title: 'Психология влияния',
    author: 'Роберт Чалдини',
    categoryId: 'c3',
    description:
      'Исследование механизмов убеждения и факторов, которые влияют на принятие решений.',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    totalCopies: 6,
    availableCopies: 5,
    createdAt: iso(3),
  },
  {
    id: 'b4',
    code: 'LIB-004',
    title: 'Краткая история времени',
    author: 'Стивен Хокинг',
    categoryId: 'c4',
    description:
      'Доступное введение в вопросы пространства, времени, чёрных дыр и происхождения Вселенной.',
    cover: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600',
    pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    totalCopies: 1,
    availableCopies: 0,
    createdAt: iso(1),
    popular: true,
  },
  {
    id: 'b5',
    code: 'LIB-005',
    title: 'Гарри Поттер и философский камень',
    author: 'Дж. К. Роулинг',
    categoryId: 'c1',
    description:
      'Первая история о юном волшебнике, который узнаёт о своём прошлом и поступает в Хогвартс.',
    cover: 'https://images.unsplash.com/photo-1518744386442-2d48ac47a7eb?w=600',
    pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    totalCopies: 10,
    availableCopies: 10,
    createdAt: iso(20),
  },
  {
    id: 'b6',
    code: 'LIB-006',
    title: 'JavaScript. Подробное руководство',
    author: 'Дэвид Флэнаган',
    categoryId: 'c2',
    description:
      'Справочник по языку JavaScript, его возможностям и современным практикам разработки.',
    cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600',
    pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    totalCopies: 3,
    availableCopies: 3,
    createdAt: iso(2),
  },
];
const demoUsers: User[] = [
  {
    id: 'u1',
    fullName: 'Александр Иванов',
    email: 'student@library.local',
    role: 'STUDENT',
    group: 'ИС-21',
  },
  {
    id: 'u2',
    fullName: 'Мария Петрова',
    email: 'student2@library.local',
    role: 'STUDENT',
    group: 'ПИ-22',
  },
  {
    id: 'u3',
    fullName: 'Данияр Садыков',
    email: 'blocked@library.local',
    role: 'STUDENT',
    group: 'ИС-20',
    blocked: true,
  },
  { id: 'u4', fullName: 'Елена Смирнова', email: 'admin@library.local', role: 'ADMIN' },
];
const initial = () => ({
  books: demoBooks,
  categories: [
    { id: 'c1', name: 'Художественная литература' },
    { id: 'c2', name: 'Программирование' },
    { id: 'c3', name: 'Психология' },
    { id: 'c4', name: 'Наука' },
  ] as Category[],
  users: demoUsers,
  passwords: { u1: 'student123', u2: 'student123', u3: 'student123', u4: 'admin123' } as Record<
    string,
    string
  >,
  loans: [
    {
      id: 'l1',
      studentId: 'u1',
      bookId: 'b1',
      issuedAt: iso(12),
      dueAt: iso(9),
      fine: 90,
      finePaid: false,
      status: 'OVERDUE',
    },
    {
      id: 'l2',
      studentId: 'u1',
      bookId: 'b2',
      issuedAt: iso(4),
      dueAt: iso(-10),
      fine: 0,
      finePaid: false,
      status: 'ACTIVE',
    },
    {
      id: 'l3',
      studentId: 'u2',
      bookId: 'b3',
      issuedAt: iso(6),
      dueAt: iso(-8),
      fine: 0,
      finePaid: false,
      status: 'ACTIVE',
    },
    {
      id: 'l4',
      studentId: 'u2',
      bookId: 'b5',
      issuedAt: iso(40),
      dueAt: iso(20),
      returnedAt: iso(21),
      fine: 50,
      finePaid: true,
      status: 'RETURNED',
    },
    {
      id: 'l5',
      studentId: 'u2',
      bookId: 'b4',
      issuedAt: iso(4),
      dueAt: iso(-10),
      fine: 0,
      finePaid: false,
      status: 'ACTIVE',
    },
  ] as Loan[],
});

type Database = ReturnType<typeof initial>;
let cache: Database | null = null;
function db(): Database {
  if (!cache) {
    try {
      cache = JSON.parse(localStorage.getItem(DB_KEY) || 'null') as Database | null;
    } catch {
      cache = null;
    }
    if (!cache) cache = clone(initial());
    if (!cache.passwords)
      cache.passwords = { u1: 'student123', u2: 'student123', u3: 'student123', u4: 'admin123' };
  }
  return cache;
}
function save() {
  if (cache) localStorage.setItem(DB_KEY, JSON.stringify(cache));
}
const wait = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export const mockApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await wait();
    const found = db().users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    const isValid = Boolean(found && db().passwords[found.id] === password);
    if (!found || !isValid) throw new Error('Неверный логин или пароль');
    if (found.blocked) throw new Error('Ваш аккаунт заблокирован, обратитесь в библиотеку');
    return { token: `mock-${found.role.toLowerCase()}-${found.id}`, user: clone(found) };
  },
  async getBooks(
    params: {
      search?: string;
      categoryId?: string;
      sort?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    await wait();
    let items = [...db().books];
    if (params.search) {
      const q = params.search.toLocaleLowerCase();
      items = items.filter((book) =>
        `${book.title} ${book.author}`.toLocaleLowerCase().includes(q),
      );
    }
    if (params.categoryId) items = items.filter((book) => book.categoryId === params.categoryId);
    if (params.sort === 'title') items.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    else items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const page = params.page || 1;
    const limit = params.limit || 6;
    return {
      items: clone(items.slice((page - 1) * limit, page * limit)),
      total: items.length,
      page,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
    };
  },
  async getAllBooks() {
    await wait();
    return clone(db().books);
  },
  async getBook(idOrCode: string) {
    await wait();
    const book = db().books.find((item) => item.id === idOrCode || item.code === idOrCode);
    if (!book) throw new Error('Книга не найдена');
    return clone(book);
  },
  async getCategories() {
    await wait();
    return clone(db().categories);
  },
  async saveBook(input: BookInput) {
    await wait();
    const data = db();
    if (data.books.some((book) => book.code === input.code && book.id !== input.id))
      throw new Error('Код книги уже используется');
    if (input.id) {
      const index = data.books.findIndex((book) => book.id === input.id);
      if (index < 0) throw new Error('Книга не найдена');
      const old = data.books[index];
      const checkedOutCopies = old.totalCopies - old.availableCopies;
      if (input.totalCopies < checkedOutCopies)
        throw new Error('Количество экземпляров не может быть меньше числа выданных книг');
      data.books[index] = {
        ...old,
        ...input,
        availableCopies: input.availableCopies ?? Number(input.totalCopies) - checkedOutCopies,
      };
    } else {
      const id = `b${Date.now()}`;
      data.books.unshift({
        ...input,
        id,
        availableCopies: input.availableCopies ?? input.totalCopies,
        createdAt: new Date().toISOString(),
      } as Book);
    }
    save();
    return clone(input.id ? data.books.find((book) => book.id === input.id)! : data.books[0]);
  },
  async deleteBook(id: string) {
    await wait();
    const data = db();
    if (data.loans.some((loan) => loan.bookId === id && loan.status !== 'RETURNED'))
      throw new Error('Нельзя удалить книгу с активными выдачами');
    data.books = data.books.filter((book) => book.id !== id);
    save();
  },
  async saveCategory(input: CategoryInput) {
    await wait();
    const data = db();
    let saved: Category;
    if (input.id) {
      saved = { id: input.id, name: input.name, description: input.description };
      data.categories = data.categories.map((item) => (item.id === input.id ? saved : item));
    } else {
      saved = { ...input, id: `c${Date.now()}` };
      data.categories.push(saved);
    }
    save();
    return clone(saved);
  },
  async deleteCategory(id: string) {
    await wait();
    const data = db();
    if (data.books.some((book) => book.categoryId === id))
      throw new Error('В категории есть книги. Сначала измените их категорию.');
    data.categories = data.categories.filter((item) => item.id !== id);
    save();
  },
  async getStudents() {
    await wait();
    return clone(db().users.filter((user) => user.role === 'STUDENT'));
  },
  async saveStudent(input: StudentInput) {
    await wait();
    const data = db();
    if (data.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase()))
      throw new Error('Пользователь с таким email уже существует');
    const user: User = {
      id: `u${Date.now()}`,
      fullName: input.fullName,
      email: input.email,
      group: input.group,
      role: 'STUDENT',
    };
    data.users.push(user);
    data.passwords[user.id] = input.password;
    save();
    return clone(user);
  },
  async toggleStudent(id: string) {
    await wait();
    const data = db();
    data.users = data.users.map((user) =>
      user.id === id ? { ...user, blocked: !user.blocked } : user,
    );
    save();
    return clone(data.users.find((user) => user.id === id)!);
  },
  // NOTE: the snapshot helper takes `now` as its second argument, so it must be
  // invoked explicitly — `Array.prototype.map` would otherwise forward the array
  // index as `now` and every loan would look active/never overdue.
  async getLoans() {
    await wait();
    return clone(db().loans.map((loan) => mockLoanSnapshot(loan)));
  },
  async getDebtors() {
    await wait();
    return clone(groupDebtorsByStudent(db().loans.map((loan) => mockLoanSnapshot(loan))));
  },
  async getMyLoans() {
    await wait();
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null;
    if (!user) throw new Error('Сессия не найдена');
    const items = db()
      .loans.filter((loan) => loan.studentId === user.id)
      .map((loan) => mockLoanSnapshot(loan));
    const unpaidFineTotal = items
      .filter((loan) => !loan.finePaid)
      .reduce((total, loan) => total + loan.fine, 0);
    return { items: clone(items), unpaidFineTotal };
  },
  async issueLoan(input: LoanInput) {
    await wait();
    const data = db();
    const student = data.users.find(
      (item) => item.id === input.studentId && item.role === 'STUDENT',
    );
    const book = data.books.find((item) => item.id === input.bookId);
    if (!student) throw new Error('Студент не найден');
    if (student.blocked) throw new Error('Нельзя выдать книгу заблокированному студенту');
    if (!Number.isInteger(input.days) || input.days < 1)
      throw new Error('Срок выдачи должен быть положительным целым числом дней');
    if (!book || book.availableCopies < 1) throw new Error('Нет доступных экземпляров книги');
    const loan: Loan = {
      id: `l${Date.now()}`,
      studentId: input.studentId,
      bookId: input.bookId,
      issuedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + input.days * 86400000).toISOString(),
      fine: 0,
      finePaid: false,
      status: 'ACTIVE',
      daysRemaining: input.days,
    };
    book.availableCopies -= 1;
    data.loans.unshift(loan);
    save();
    return clone(loan);
  },
  async returnLoan(id: string) {
    await wait();
    const data = db();
    const loan = data.loans.find((item) => item.id === id);
    if (!loan || loan.status === 'RETURNED') throw new Error('Выдача уже закрыта');
    const daysLate = Math.max(
      0,
      Math.ceil((Date.now() - new Date(loan.dueAt).getTime()) / 86400000),
    );
    loan.fine = daysLate * 10;
    loan.returnedAt = new Date().toISOString();
    loan.status = 'RETURNED';
    loan.daysRemaining = undefined;
    const book = data.books.find((item) => item.id === loan.bookId);
    if (book) book.availableCopies += 1;
    save();
    return clone(loan);
  },
  async payFine(id: string) {
    await wait();
    const loan = db().loans.find((item) => item.id === id);
    if (!loan) throw new Error('Выдача не найдена');
    if (loan.fine <= 0) throw new Error('По этой выдаче нет штрафа к оплате');
    if (loan.finePaid) throw new Error('Штраф уже отмечен как оплаченный');
    loan.finePaid = true;
    save();
    return clone(loan);
  },
  async getDashboard(): Promise<DashboardStats> {
    await wait();
    const data = db();
    const allLoans = data.loans.map((loan) => mockLoanSnapshot(loan));
    const active = allLoans.filter((loan) => loan.status !== 'RETURNED');
    const debtorIds = new Set(
      allLoans
        .filter((loan) => loan.status === 'OVERDUE' || (loan.fine > 0 && !loan.finePaid))
        .map((loan) => loan.studentId),
    );
    return {
      totalBooks: data.books.reduce((sum, book) => sum + book.totalCopies, 0),
      activeLoans: active.length,
      debtors: debtorIds.size,
      unpaidFines: data.loans
        .filter((loan) => !loan.finePaid)
        .reduce((sum, loan) => sum + loan.fine, 0),
    };
  },
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await wait();
    if (db().passwords[userId] !== currentPassword)
      throw new Error('Текущий пароль указан неверно');
    if (newPassword.length < 8) throw new Error('Минимум 8 символов');
    db().passwords[userId] = newPassword;
    save();
  },
};
