import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Download,
  Edit3,
  Eye,
  LockKeyhole,
  Plus,
  Printer,
  QrCode,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { adminService, libraryService, USE_MOCKS } from '../api/services';
import { ConfirmDialog, Modal } from '../components/Modal';
import { EmptyState, PageHeading, SearchInput } from '../components/Shared';
import { useToast } from '../context/ToastContext';
import { booksLabel, formatDate, formatMoney, loanDueState, loansLabel } from '../utils/format';
import type { Book, BookInput, Category, DebtorSummary, Loan, StudentInput, User } from '../types';

const emptyBook: BookInput = {
  code: '',
  title: '',
  author: '',
  categoryId: '',
  description: '',
  cover: '',
  pdfUrl: '',
  totalCopies: 1,
  availableCopies: 1,
};

export function DashboardPage() {
  const { notify } = useToast();
  const [stats, setStats] = useState({ totalBooks: 0, activeLoans: 0, debtors: 0, unpaidFines: 0 });
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      adminService.getDashboard(),
      adminService.getLoans(),
      libraryService.getAllBooks(),
      adminService.getStudents(),
    ])
      .then(([dashboard, loanItems, bookItems, studentItems]) => {
        if (!active) return;
        setStats(dashboard);
        setLoans(loanItems);
        setBooks(bookItems);
        setStudents(studentItems);
      })
      .catch((error: Error) => {
        if (!active) return;
        const message = error.message || 'Не удалось загрузить статистику';
        setLoadError(message);
        notify(message, 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [notify]);

  const bookMap = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );
  const cards = [
    {
      label: 'Экземпляров в фонде',
      value: stats.totalBooks.toLocaleString('ru-RU'),
      icon: BookOpen,
      note: 'Общий библиотечный фонд',
      tone: 'blue',
    },
    {
      label: 'Выдано сейчас',
      value: stats.activeLoans,
      icon: Activity,
      note: 'Активные выдачи',
      tone: 'mint',
    },
    {
      label: 'Должников',
      value: stats.debtors,
      icon: AlertTriangle,
      note: 'Есть просроченные книги',
      tone: 'amber',
    },
    {
      label: 'Неоплаченные штрафы',
      value: formatMoney(stats.unpaidFines),
      icon: Wallet,
      note: 'Сумма по данным системы',
      tone: 'rose',
    },
  ];
  const monthly = [7, 11, 9, 15, 12, 18, 14, 21, 17, 24, 19, Math.max(12, loans.length * 5)];

  return (
    <div className="content-wrap admin-content">
      <PageHeading
        eyebrow="Рабочее пространство"
        title="Обзор библиотеки"
        description="Ключевые показатели и последние события библиотечного фонда."
        action={
          <span className="live-indicator">
            <i />
            {loading ? 'Загрузка данных' : loadError ? 'Ошибка загрузки' : 'Данные обновлены'}
          </span>
        }
      />
      <div className="stat-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.tone}`}>
              <card.icon size={19} />
            </div>
            <span>{card.label}</span>
            <strong>{loading ? '—' : card.value}</strong>
            <small>{card.note}</small>
          </div>
        ))}
      </div>
      {loadError && <div className="inline-alert alert-error">{loadError}</div>}
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          {USE_MOCKS ? (
            <>
              <div className="panel-heading">
                <div>
                  <h2>Динамика выдач</h2>
                  <p>Демонстрационные значения mock-режима</p>
                </div>
                <span className="chart-legend">
                  <i />
                  Выдачи
                </span>
              </div>
              <div className="bar-chart">
                {monthly.map((value, index) => (
                  <div className="bar-column" key={index}>
                    <div className="bar-area">
                      <div
                        className="bar-fill"
                        style={{ height: `${value * 3.3}%` }}
                        title={`${value} выдач`}
                      />
                    </div>
                    <span>
                      {
                        [
                          'Янв',
                          'Фев',
                          'Мар',
                          'Апр',
                          'Май',
                          'Июн',
                          'Июл',
                          'Авг',
                          'Сен',
                          'Окт',
                          'Ноя',
                          'Дек',
                        ][index]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="panel-heading">
              <div>
                <h2>Динамика выдач</h2>
                <p>
                  Для графика реальной статистики backend должен предоставить историю выдач по
                  периодам.
                </p>
              </div>
            </div>
          )}
        </section>
        <section className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>Быстрые действия</h2>
              <p>Часто используемые разделы</p>
            </div>
          </div>
          <Link to="/admin/books" className="quick-link">
            <span className="quick-icon">
              <Plus size={17} />
            </span>
            <span>
              <strong>Добавить книгу</strong>
              <small>Новый экземпляр в каталог</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
          <Link to="/admin/students" className="quick-link">
            <span className="quick-icon">
              <Users size={17} />
            </span>
            <span>
              <strong>Новый студент</strong>
              <small>Создать учётную запись</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
          <Link to="/admin/loans" className="quick-link">
            <span className="quick-icon">
              <BookOpen size={17} />
            </span>
            <span>
              <strong>Оформить выдачу</strong>
              <small>Выдать книгу читателю</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Последние выдачи</h2>
            <p>Недавние операции по библиотечному фонду</p>
          </div>
          <Link to="/admin/loans" className="text-link">
            Все операции <ArrowUpRight size={15} />
          </Link>
        </div>
        {loading ? (
          <div className="loading-panel">Загружаем последние операции...</div>
        ) : loans.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Книга</th>
                  <th>Дата выдачи</th>
                  <th>Срок возврата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {loans.slice(0, 5).map((loan) => {
                  const state = loanDueState(loan);
                  return (
                    <tr key={loan.id}>
                      <td>{studentMap.get(loan.studentId)?.fullName || 'Студент'}</td>
                      <td>{bookMap.get(loan.bookId)?.title || 'Книга'}</td>
                      <td>{formatDate(loan.issuedAt)}</td>
                      <td>{formatDate(loan.dueAt)}</td>
                      <td>
                        <span className={`status-pill status-${state.className}`}>
                          {loan.status === 'RETURNED' ? 'Возвращена' : state.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : loadError ? (
          <EmptyState title="Нет данных" description="Не удалось получить историю выдач." />
        ) : (
          <EmptyState title="Операций пока нет" />
        )}
      </section>
    </div>
  );
}

type BookFormErrorKey =
  'title' | 'author' | 'code' | 'categoryId' | 'totalCopies' | 'cover' | 'pdfUrl' | 'description';
type BookFormErrors = Partial<Record<BookFormErrorKey, string>>;

function isHttpResourceUrl(value: string): boolean {
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AdminBooksPage() {
  const { notify } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [bookSort, setBookSort] = useState('newest');
  const [bookPage, setBookPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState<BookInput>(emptyBook);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<BookFormErrors>({});
  const [confirmDelete, setConfirmDelete] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [qrBook, setQrBook] = useState<Book | null>(null);
  const [qrData, setQrData] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const refresh = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const [items, cats] = await Promise.all([
        libraryService.getAllBooks(),
        libraryService.getCategories(),
      ]);
      setBooks(items);
      setCategories(cats);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Не удалось загрузить книги';
      setListError(message);
      throw loadError;
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((loadError: Error) => notify(loadError.message, 'error'));
  }, [refresh, notify]);

  const filtered = books
    .filter(
      (book) =>
        (!categoryId || book.categoryId === categoryId) &&
        `${book.title} ${book.author} ${book.code}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((left, right) =>
      bookSort === 'title'
        ? left.title.localeCompare(right.title, 'ru')
        : right.createdAt.localeCompare(left.createdAt),
    );
  const bookPageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / bookPageSize));
  const visibleBooks = filtered.slice((bookPage - 1) * bookPageSize, bookPage * bookPageSize);

  useEffect(() => {
    if (bookPage > pageCount) setBookPage(pageCount);
  }, [bookPage, pageCount]);

  const openCreate = () => {
    const maxCode = books.reduce((max, book) => {
      const match = /^LIB-(\d+)$/.exec(book.code);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    setEditing(null);
    setForm({
      ...emptyBook,
      code: `LIB-${String(maxCode + 1).padStart(3, '0')}`,
      categoryId: categories[0]?.id || '',
    });
    setError('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setForm({ ...book });
    setError('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const setField = (key: keyof BookInput, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Не удалось прочитать файл ${file.name}`));
      reader.readAsDataURL(file);
    });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    setFieldErrors({});

    const formElement = event.currentTarget;
    const coverFile = (formElement.elements.namedItem('coverFile') as HTMLInputElement).files?.[0];
    const pdfFile = (formElement.elements.namedItem('pdfFile') as HTMLInputElement).files?.[0];
    const nextErrors: BookFormErrors = {};
    const title = form.title.trim();
    const author = form.author.trim();
    const code = form.code.trim();
    const description = form.description.trim();

    if (!title) nextErrors.title = 'Введите название книги';
    if (!author) nextErrors.author = 'Укажите автора';
    if (!code) nextErrors.code = 'Укажите код книги';
    if (!form.categoryId) nextErrors.categoryId = 'Выберите категорию';
    if (!Number.isInteger(Number(form.totalCopies)) || Number(form.totalCopies) < 1) {
      nextErrors.totalCopies = 'Укажите положительное целое число экземпляров';
    }
    if (!description) nextErrors.description = 'Добавьте краткое описание книги';
    if (
      coverFile &&
      !coverFile.type.startsWith('image/') &&
      !/\.(png|jpe?g|webp|gif|avif)$/i.test(coverFile.name)
    ) {
      nextErrors.cover = 'Файл обложки должен быть изображением';
    } else if (!coverFile && !form.cover.trim()) {
      nextErrors.cover = 'Добавьте URL обложки или загрузите изображение';
    } else if (
      !coverFile &&
      !(USE_MOCKS && form.cover.startsWith('data:image/')) &&
      !isHttpResourceUrl(form.cover.trim())
    ) {
      nextErrors.cover = 'Укажите корректный HTTP(S)-адрес обложки';
    }
    if (pdfFile && pdfFile.type !== 'application/pdf' && !/\.pdf$/i.test(pdfFile.name)) {
      nextErrors.pdfUrl = 'Файл книги должен иметь формат PDF';
    } else if (!pdfFile && !form.pdfUrl.trim()) {
      nextErrors.pdfUrl = 'Добавьте URL PDF или загрузите PDF-файл';
    } else if (
      !pdfFile &&
      !(USE_MOCKS && form.pdfUrl.startsWith('data:application/pdf')) &&
      !isHttpResourceUrl(form.pdfUrl.trim())
    ) {
      nextErrors.pdfUrl = 'Укажите корректный HTTP(S)-адрес PDF';
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError('Проверьте поля, отмеченные сообщениями об ошибках.');
      return;
    }

    setSaving(true);
    try {
      const cover = coverFile && USE_MOCKS ? await fileToDataUrl(coverFile) : form.cover.trim();
      const pdfUrl = pdfFile && USE_MOCKS ? await fileToDataUrl(pdfFile) : form.pdfUrl.trim();
      await libraryService.saveBook({
        ...form,
        title,
        author,
        code,
        description,
        cover,
        pdfUrl,
        coverFile: USE_MOCKS ? undefined : coverFile,
        pdfFile: USE_MOCKS ? undefined : pdfFile,
        totalCopies: Number(form.totalCopies),
        availableCopies: undefined,
        id: editing?.id,
      });
      notify(editing ? 'Изменения книги сохранены' : 'Книга успешно добавлена');
      setModalOpen(false);
      refresh().catch((refreshError: Error) =>
        notify(`Книга сохранена, но список не обновлён: ${refreshError.message}`, 'error'),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить книгу');
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    try {
      await libraryService.deleteBook(confirmDelete.id);
      setConfirmDelete(null);
      notify('Книга удалена');
      refresh().catch((refreshError: Error) =>
        notify(`Книга удалена, но список не обновлён: ${refreshError.message}`, 'error'),
      );
    } catch (deleteError) {
      notify(
        deleteError instanceof Error ? deleteError.message : 'Не удалось удалить книгу',
        'error',
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const showQR = async (book: Book) => {
    const url = `${window.location.origin}/books/qr/${encodeURIComponent(book.code)}`;
    setQrBook(book);
    setQrData('');
    try {
      setQrData(
        await QRCode.toDataURL(url, {
          width: 420,
          margin: 2,
          color: { dark: '#152b3c', light: '#ffffff' },
        }),
      );
    } catch {
      notify('Не удалось создать QR-код', 'error');
      setQrBook(null);
    }
  };

  const downloadQR = () => {
    if (!qrData || !qrBook) return;
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `qr-${qrBook.code}.png`;
    link.click();
  };

  return (
    <div className="content-wrap admin-content">
      <PageHeading
        eyebrow="Библиотечный фонд"
        title="Управление книгами"
        description="Каталог изданий, загрузка материалов и QR-коды для книг."
        action={
          <button className="button button-primary" onClick={openCreate}>
            <Plus size={17} />
            Добавить книгу
          </button>
        }
      />
      <div className="admin-filters">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setBookPage(1);
          }}
          placeholder="Название, автор или код"
        />
        <select
          className="select-field"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setBookPage(1);
          }}
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="select-field"
          value={bookSort}
          onChange={(event) => {
            setBookSort(event.target.value);
            setBookPage(1);
          }}
        >
          <option value="newest">Сначала новые</option>
          <option value="title">По названию</option>
        </select>
        <span className="muted">Найдено: {filtered.length}</span>
      </div>

      <div className="panel table-panel">
        {listLoading ? (
          <div className="loading-panel">Загружаем каталог...</div>
        ) : listError ? (
          <EmptyState title="Не удалось загрузить книги" description={listError} />
        ) : visibleBooks.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Книга</th>
                  <th>Категория</th>
                  <th>Экземпляры</th>
                  <th>Доступно</th>
                  <th>Добавлена</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {visibleBooks.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div className="table-book">
                        <img src={book.cover} alt={`Обложка книги ${book.title}`} />
                        <div>
                          <strong>{book.title}</strong>
                          <span>
                            {book.author} · {book.code}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {categories.find((category) => category.id === book.categoryId)?.name || '—'}
                    </td>
                    <td>{book.totalCopies}</td>
                    <td>
                      <span className={book.availableCopies ? 'text-success' : 'text-danger'}>
                        {book.availableCopies}
                      </span>
                    </td>
                    <td>{formatDate(book.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          title="QR-код"
                          aria-label="QR-код"
                          onClick={() => showQR(book)}
                        >
                          <QrCode size={17} />
                        </button>
                        <button
                          className="icon-button"
                          title="Редактировать"
                          aria-label="Редактировать"
                          onClick={() => openEdit(book)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="icon-button danger-icon"
                          title="Удалить"
                          aria-label="Удалить"
                          onClick={() => setConfirmDelete(book)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Книги не найдены"
            description="Измените фильтры или добавьте новое издание."
          />
        )}
        {!listLoading && !listError && filtered.length > bookPageSize && (
          <div className="pagination">
            <button
              className="button button-ghost button-small"
              disabled={bookPage <= 1}
              onClick={() => setBookPage((value) => value - 1)}
            >
              Назад
            </button>
            <span>
              Страница {bookPage} из {pageCount}
            </span>
            <button
              className="button button-ghost button-small"
              disabled={bookPage >= pageCount}
              onClick={() => setBookPage((value) => value + 1)}
            >
              Далее
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'Редактировать книгу' : 'Новая книга'}
          onClose={() => {
            if (!saving) setModalOpen(false);
          }}
          wide
        >
          <form className="form-stack" onSubmit={submit} noValidate>
            {error && <div className="inline-alert alert-error">{error}</div>}
            <div className="form-grid">
              <label className="form-field">
                <span>Название *</span>
                <input
                  className="text-input"
                  value={form.title}
                  onChange={(event) => setField('title', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.title)}
                  required
                />
                {fieldErrors.title && <small className="field-error">{fieldErrors.title}</small>}
              </label>
              <label className="form-field">
                <span>Автор *</span>
                <input
                  className="text-input"
                  value={form.author}
                  onChange={(event) => setField('author', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.author)}
                  required
                />
                {fieldErrors.author && <small className="field-error">{fieldErrors.author}</small>}
              </label>
              <label className="form-field">
                <span>Код книги *</span>
                <input
                  className="text-input"
                  value={form.code}
                  onChange={(event) => setField('code', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.code)}
                  required
                />
                {fieldErrors.code && <small className="field-error">{fieldErrors.code}</small>}
              </label>
              <label className="form-field">
                <span>Категория *</span>
                <select
                  className="text-input"
                  value={form.categoryId}
                  onChange={(event) => setField('categoryId', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.categoryId)}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId && (
                  <small className="field-error">{fieldErrors.categoryId}</small>
                )}
              </label>
              <label className="form-field">
                <span>Количество экземпляров *</span>
                <input
                  className="text-input"
                  type="number"
                  min="1"
                  step="1"
                  value={form.totalCopies}
                  onChange={(event) => setField('totalCopies', Number(event.target.value))}
                  aria-invalid={Boolean(fieldErrors.totalCopies)}
                  required
                />
                {fieldErrors.totalCopies && (
                  <small className="field-error">{fieldErrors.totalCopies}</small>
                )}
              </label>
              <label className="form-field">
                <span>Обложка (URL)</span>
                <input
                  className="text-input"
                  type="url"
                  value={form.cover.startsWith('data:') ? '' : form.cover}
                  onChange={(event) => setField('cover', event.target.value)}
                  placeholder="https://..."
                  aria-invalid={Boolean(fieldErrors.cover)}
                />
                {fieldErrors.cover && <small className="field-error">{fieldErrors.cover}</small>}
              </label>
              <label className="form-field">
                <span>Загрузить обложку</span>
                <input
                  className="text-input file-input"
                  name="coverFile"
                  type="file"
                  accept="image/*"
                  aria-invalid={Boolean(fieldErrors.cover)}
                  onChange={() => setFieldErrors((current) => ({ ...current, cover: undefined }))}
                />
              </label>
              <label className="form-field">
                <span>PDF книги (URL)</span>
                <input
                  className="text-input"
                  type="url"
                  value={form.pdfUrl.startsWith('data:') ? '' : form.pdfUrl}
                  onChange={(event) => setField('pdfUrl', event.target.value)}
                  placeholder="https://..."
                  aria-invalid={Boolean(fieldErrors.pdfUrl)}
                />
                {fieldErrors.pdfUrl && <small className="field-error">{fieldErrors.pdfUrl}</small>}
              </label>
              <label className="form-field">
                <span>Загрузить PDF</span>
                <input
                  className="text-input file-input"
                  name="pdfFile"
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-invalid={Boolean(fieldErrors.pdfUrl)}
                  onChange={() => setFieldErrors((current) => ({ ...current, pdfUrl: undefined }))}
                />
              </label>
            </div>
            <label className="form-field">
              <span>Краткое описание *</span>
              <textarea
                className="text-input textarea"
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                rows={3}
                aria-invalid={Boolean(fieldErrors.description)}
                required
              />
              {fieldErrors.description && (
                <small className="field-error">{fieldErrors.description}</small>
              )}
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Отмена
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить книгу'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Удалить книгу?"
          message={`Книга «${confirmDelete.title}» будет удалена из каталога. Действие нельзя отменить.`}
          danger
          confirmText="Удалить"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={deleteBook}
          busy={deleting}
        />
      )}
      {qrBook && (
        <Modal
          title={`QR-код · ${qrBook.code}`}
          onClose={() => {
            setQrBook(null);
            setQrData('');
          }}
        >
          <div className="qr-modal-content">
            {qrData ? (
              <img src={qrData} alt={`QR-код книги ${qrBook.title}`} />
            ) : (
              <div className="loading-panel">Создаём QR-код...</div>
            )}
            <strong>{qrBook.title}</strong>
            <span className="muted">Ссылка ведёт на публичную страницу книги по QR-коду.</span>
            <button
              className="button button-primary button-full"
              onClick={downloadQR}
              disabled={!qrData}
            >
              <Download size={16} />
              Скачать PNG
            </button>
            <button
              className="button button-ghost button-full"
              onClick={() => {
                document.body.classList.add('print-qr');
                window.addEventListener(
                  'afterprint',
                  () => document.body.classList.remove('print-qr'),
                  { once: true },
                );
                window.print();
              }}
            >
              <Printer size={16} />
              Печать QR-кода
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function AdminCategoriesPage() {
  const { notify } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [categoryItems, bookItems] = await Promise.all([
        libraryService.getCategories(),
        libraryService.getAllBooks(),
      ]);
      setCategories(categoryItems);
      setBooks(bookItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить категории';
      setLoadError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((error: Error) => notify(error.message, 'error'));
  }, [refresh, notify]);

  const start = (category?: Category) => {
    setEditing(category || null);
    setName(category?.name || '');
    setDescription(category?.description || '');
    setFieldError('');
    setFormError('');
    setOpen(true);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const cleanName = name.trim();
    setFieldError('');
    setFormError('');
    if (!cleanName) {
      setFieldError('Введите название категории');
      return;
    }

    setSaving(true);
    try {
      await libraryService.saveCategory({
        id: editing?.id,
        name: cleanName,
        description: description.trim(),
      });
      setOpen(false);
      notify(editing ? 'Категория обновлена' : 'Категория создана');
      refresh().catch((error: Error) =>
        notify(`Категория сохранена, но список не обновлён: ${error.message}`, 'error'),
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ошибка сохранения категории');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm || deleting) return;
    setDeleting(true);
    try {
      await libraryService.deleteCategory(confirm.id);
      setConfirm(null);
      notify('Категория удалена');
      refresh().catch((error: Error) =>
        notify(`Категория удалена, но список не обновлён: ${error.message}`, 'error'),
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Не удалось удалить категорию', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="content-wrap admin-content">
      <PageHeading
        eyebrow="Структура каталога"
        title="Категории"
        description="Организуйте библиотечный фонд по тематическим разделам."
        action={
          <button className="button button-primary" onClick={() => start()}>
            <Plus size={17} />
            Добавить категорию
          </button>
        }
      />
      {loading ? (
        <div className="panel loading-panel">Загружаем категории...</div>
      ) : loadError ? (
        <EmptyState title="Не удалось загрузить категории" description={loadError} />
      ) : categories.length ? (
        <div className="category-grid">
          {categories.map((category, index) => (
            <article className="category-card" key={category.id}>
              <div className="category-card-top">
                <span className="category-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="table-actions">
                  <button
                    className="icon-button"
                    aria-label={`Редактировать категорию ${category.name}`}
                    onClick={() => start(category)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-button danger-icon"
                    aria-label={`Удалить категорию ${category.name}`}
                    onClick={() => setConfirm(category)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h2>{category.name}</h2>
              <p>{category.description || 'Тематическая категория библиотеки.'}</p>
              <div className="category-footer">
                <span>
                  <BookOpen size={15} />
                  {booksLabel(books.filter((book) => book.categoryId === category.id).length)}
                </span>
                <span className="category-accent" />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Категорий пока нет"
          description="Создайте первую категорию для организации каталога."
        />
      )}

      {open && (
        <Modal
          title={editing ? 'Редактировать категорию' : 'Новая категория'}
          onClose={() => {
            if (!saving) setOpen(false);
          }}
        >
          <form className="form-stack" onSubmit={save} noValidate>
            {formError && <div className="inline-alert alert-error">{formError}</div>}
            <label className="form-field">
              <span>Название *</span>
              <input
                className="text-input"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldError('');
                }}
                aria-invalid={Boolean(fieldError)}
                required
              />
              {fieldError && <small className="field-error">{fieldError}</small>}
            </label>
            <label className="form-field">
              <span>Описание</span>
              <textarea
                className="text-input textarea"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Отмена
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog
          title="Удалить категорию?"
          message={`Категория «${confirm.name}» будет удалена. Нельзя удалить категорию, в которой остались книги.`}
          danger
          confirmText="Удалить"
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
          busy={deleting}
        />
      )}
    </div>
  );
}

export function AdminStudentsPage() {
  const { notify } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StudentInput>({
    fullName: '',
    email: '',
    group: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StudentInput, string>>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirm, setConfirm] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [users, loanItems, bookItems] = await Promise.all([
        adminService.getStudents(),
        adminService.getLoans(),
        libraryService.getAllBooks(),
      ]);
      setStudents(users);
      setLoans(loanItems);
      setBooks(bookItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить студентов';
      setLoadError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((error: Error) => notify(error.message, 'error'));
  }, [refresh, notify]);

  const filtered = students.filter((student) =>
    `${student.fullName} ${student.email} ${student.group || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const updateField = (key: keyof StudentInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    const nextErrors: Partial<Record<keyof StudentInput, string>> = {};
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const group = form.group.trim();
    if (!fullName) nextErrors.fullName = 'Введите ФИО студента';
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Введите корректный email';
    if (!group) nextErrors.group = 'Укажите учебную группу';
    if (form.password.length < 8)
      nextErrors.password = 'Временный пароль должен содержать минимум 8 символов';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await adminService.saveStudent({ ...form, fullName, email, group });
      setOpen(false);
      setForm({ fullName: '', email: '', group: '', password: '' });
      notify('Студент успешно добавлен');
      refresh().catch((refreshError: Error) =>
        notify(`Студент создан, но список не обновлён: ${refreshError.message}`, 'error'),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка создания студента');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async () => {
    if (!confirm || toggling) return;
    setToggling(true);
    try {
      await adminService.toggleStudent(confirm.id);
      const wasBlocked = confirm.blocked;
      setConfirm(null);
      notify(wasBlocked ? 'Студент разблокирован' : 'Студент заблокирован');
      refresh().catch((refreshError: Error) =>
        notify(`Статус изменён, но список не обновлён: ${refreshError.message}`, 'error'),
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Ошибка изменения статуса', 'error');
    } finally {
      setToggling(false);
    }
  };

  const startCreate = () => {
    setForm({ fullName: '', email: '', group: '', password: '' });
    setFieldErrors({});
    setError('');
    setOpen(true);
  };
  const studentLoans = profile ? loans.filter((loan) => loan.studentId === profile.id) : [];

  return (
    <div className="content-wrap admin-content">
      <PageHeading
        eyebrow="Читатели библиотеки"
        title="Студенты"
        description="Создание учётных записей, управление доступом и история выдач."
        action={
          <button className="button button-primary" onClick={startCreate}>
            <Plus size={17} />
            Добавить студента
          </button>
        }
      />
      <div className="admin-filters">
        <SearchInput value={search} onChange={setSearch} placeholder="Имя, email или группа" />
        <span className="muted">Всего студентов: {students.length}</span>
      </div>
      <div className="panel table-panel">
        {loading ? (
          <div className="loading-panel">Загружаем студентов...</div>
        ) : loadError ? (
          <EmptyState title="Не удалось загрузить студентов" description={loadError} />
        ) : filtered.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Группа</th>
                  <th>Книги на руках</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-cell">
                        <span className="user-avatar">
                          {student.fullName
                            .split(' ')
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <div>
                          <strong>{student.fullName}</strong>
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{student.group || '—'}</td>
                    <td>
                      {
                        loans.filter(
                          (loan) => loan.studentId === student.id && loan.status !== 'RETURNED',
                        ).length
                      }
                    </td>
                    <td>
                      <span
                        className={`status-pill ${student.blocked ? 'status-danger' : 'status-success'}`}
                      >
                        {student.blocked ? 'Заблокирован' : 'Активен'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          aria-label={`Карточка студента ${student.fullName}`}
                          title="Карточка студента"
                          onClick={() => setProfile(student)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className={`icon-button ${student.blocked ? '' : 'danger-icon'}`}
                          title={student.blocked ? 'Разблокировать' : 'Заблокировать'}
                          aria-label={student.blocked ? 'Разблокировать' : 'Заблокировать'}
                          onClick={() => setConfirm(student)}
                        >
                          {student.blocked ? <ShieldCheck size={17} /> : <LockKeyhole size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={search ? 'Студенты не найдены' : 'Студентов пока нет'}
            description={
              search ? 'Измените поисковый запрос.' : 'Создайте первую учётную запись студента.'
            }
          />
        )}
      </div>

      {open && (
        <Modal
          title="Новый студент"
          onClose={() => {
            if (!saving) setOpen(false);
          }}
        >
          <form className="form-stack" onSubmit={submit} noValidate>
            {error && <div className="inline-alert alert-error">{error}</div>}
            <label className="form-field">
              <span>ФИО *</span>
              <input
                className="text-input"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                aria-invalid={Boolean(fieldErrors.fullName)}
                required
              />
              {fieldErrors.fullName && (
                <small className="field-error">{fieldErrors.fullName}</small>
              )}
            </label>
            <label className="form-field">
              <span>Email *</span>
              <input
                className="text-input"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                autoComplete="email"
                required
              />
              {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
            </label>
            <label className="form-field">
              <span>Группа *</span>
              <input
                className="text-input"
                value={form.group}
                onChange={(event) => updateField('group', event.target.value)}
                aria-invalid={Boolean(fieldErrors.group)}
                required
              />
              {fieldErrors.group && <small className="field-error">{fieldErrors.group}</small>}
            </label>
            <label className="form-field">
              <span>Временный пароль *</span>
              <input
                className="text-input"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="new-password"
                required
              />
              {fieldErrors.password && (
                <small className="field-error">{fieldErrors.password}</small>
              )}
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Отмена
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving ? 'Создаём...' : 'Создать учётную запись'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.blocked ? 'Разблокировать студента?' : 'Заблокировать студента?'}
          message={`${confirm.fullName}: ${confirm.blocked ? 'доступ к личному кабинету будет восстановлен.' : 'вход в личный кабинет будет запрещён.'}`}
          confirmText={confirm.blocked ? 'Разблокировать' : 'Заблокировать'}
          danger={!confirm.blocked}
          onCancel={() => setConfirm(null)}
          onConfirm={toggle}
          busy={toggling}
        />
      )}
      {profile && (
        <Modal title="Карточка студента" onClose={() => setProfile(null)} wide>
          <div className="student-profile-head">
            <span className="profile-avatar">
              <Users size={22} />
            </span>
            <div>
              <strong>{profile.fullName}</strong>
              <span>
                {profile.email} · {profile.group}
              </span>
            </div>
            <span className={`status-pill ${profile.blocked ? 'status-danger' : 'status-success'}`}>
              {profile.blocked ? 'Заблокирован' : 'Активен'}
            </span>
          </div>
          <h3 className="mini-section-title">История выдач</h3>
          {studentLoans.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Книга</th>
                    <th>Выдана</th>
                    <th>Срок</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {studentLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>{books.find((book) => book.id === loan.bookId)?.title || 'Книга'}</td>
                      <td>{formatDate(loan.issuedAt)}</td>
                      <td>{formatDate(loan.dueAt)}</td>
                      <td>
                        <span className={`status-pill status-${loanDueState(loan).className}`}>
                          {loan.status === 'RETURNED' ? 'Возвращена' : loanDueState(loan).label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Выдач пока нет" />
          )}
        </Modal>
      )}
    </div>
  );
}

export function AdminLoansPage() {
  const { notify } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [debtors, setDebtors] = useState<DebtorSummary[]>([]);
  const [studentId, setStudentId] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [bookId, setBookId] = useState('');
  const [issueErrors, setIssueErrors] = useState<
    Partial<Record<'studentId' | 'bookId' | 'days', string>>
  >({});
  const [days, setDays] = useState(14);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'debtors' | 'history'>('active');
  const [confirmReturn, setConfirmReturn] = useState<Loan | null>(null);
  const [confirmPay, setConfirmPay] = useState<Loan | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(() => {
    setLoadError('');
    return Promise.all([
      adminService.getStudents(),
      libraryService.getAllBooks(),
      adminService.getLoans(),
      adminService.getDebtors(),
    ]).then(([users, bookItems, loanItems, debtorItems]) => {
      setStudents(users);
      setBooks(bookItems);
      setLoans(loanItems);
      setDebtors(debtorItems);
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh()
      .catch((error: Error) => {
        if (!active) return;
        setLoadError(error.message || 'Не удалось загрузить операции библиотеки');
        notify(error.message || 'Не удалось загрузить операции библиотеки', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [notify, refresh]);

  const bookMap = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );
  const active = loans.filter((loan) => loan.status !== 'RETURNED');
  const history = loans.filter((loan) => loan.status === 'RETURNED');
  const visible = (tab === 'active' ? active : history).filter((loan) =>
    `${studentMap.get(loan.studentId)?.fullName || ''} ${bookMap.get(loan.bookId)?.title || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const visibleDebtors = debtors.filter((debtor) => {
    const studentName = studentMap.get(debtor.studentId)?.fullName || '';
    const bookNames = debtor.loans.map((loan) => bookMap.get(loan.bookId)?.title || '').join(' ');
    return `${studentName} ${bookNames}`.toLowerCase().includes(search.toLowerCase());
  });

  const issue = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const nextErrors: Partial<Record<'studentId' | 'bookId' | 'days', string>> = {};
    if (!studentId) nextErrors.studentId = 'Выберите студента';
    if (!bookId) nextErrors.bookId = 'Выберите книгу';
    if (!Number.isInteger(days) || days < 1)
      nextErrors.days = 'Укажите положительное целое число дней';
    setIssueErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await adminService.issueLoan({ studentId, bookId, days });
      notify('Книга успешно выдана');
      setStudentId('');
      setStudentQuery('');
      setBookId('');
      setIssueErrors({});
      refresh().catch((refreshError: Error) =>
        notify(`Выдача оформлена, но список не обновлён: ${refreshError.message}`, 'error'),
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Не удалось оформить выдачу', 'error');
    } finally {
      setSaving(false);
    }
  };

  const returnBook = async () => {
    if (!confirmReturn || actionSaving) return;
    setActionSaving(true);
    try {
      const result = await adminService.returnLoan(confirmReturn.id);
      setConfirmReturn(null);
      notify(`Возврат принят. Штраф: ${formatMoney(result.fine)}`);
      refresh().catch((refreshError: Error) =>
        notify(`Возврат принят, но список не обновлён: ${refreshError.message}`, 'error'),
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Не удалось принять возврат', 'error');
    } finally {
      setActionSaving(false);
      setConfirmReturn(null);
    }
  };

  const payFine = async () => {
    if (!confirmPay || actionSaving) return;
    setActionSaving(true);
    try {
      await adminService.payFine(confirmPay.id);
      setConfirmPay(null);
      notify('Штраф отмечен как оплаченный');
      refresh().catch((refreshError: Error) =>
        notify(`Оплата отмечена, но список не обновлён: ${refreshError.message}`, 'error'),
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Не удалось обновить штраф', 'error');
    } finally {
      setActionSaving(false);
      setConfirmPay(null);
    }
  };

  return (
    <div className="content-wrap admin-content">
      <PageHeading
        eyebrow="Операции библиотеки"
        title="Выдача и возврат"
        description="Оформляйте выдачу, принимайте возврат и контролируйте просрочки."
      />
      <section className="panel issue-panel">
        <div className="panel-heading">
          <div>
            <h2>Оформить выдачу</h2>
            <p>Выберите студента, доступную книгу и срок возврата.</p>
          </div>
          <span className="panel-icon">
            <BookOpen size={19} />
          </span>
        </div>
        <form className="issue-form" onSubmit={issue} noValidate>
          <label className="form-field">
            <span>Студент *</span>
            <input
              className="text-input"
              value={studentQuery}
              onChange={(event) => {
                setStudentQuery(event.target.value);
                setStudentId('');
                setIssueErrors((current) => ({ ...current, studentId: undefined }));
              }}
              placeholder="Поиск по имени или группе"
              aria-label="Поиск студента по имени или группе"
            />
            <select
              className="text-input"
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value);
                setIssueErrors((current) => ({ ...current, studentId: undefined }));
              }}
              aria-invalid={Boolean(issueErrors.studentId)}
            >
              <option value="">Выберите студента</option>
              {students
                .filter(
                  (student) =>
                    !student.blocked &&
                    `${student.fullName} ${student.group || ''}`
                      .toLowerCase()
                      .includes(studentQuery.toLowerCase()),
                )
                .map((student) => (
                  <option value={student.id} key={student.id}>
                    {student.fullName} · {student.group}
                  </option>
                ))}
            </select>
            {issueErrors.studentId && (
              <small className="field-error">{issueErrors.studentId}</small>
            )}
          </label>
          <label className="form-field">
            <span>Книга *</span>
            <select
              className="text-input"
              value={bookId}
              onChange={(event) => {
                setBookId(event.target.value);
                setIssueErrors((current) => ({ ...current, bookId: undefined }));
              }}
              aria-invalid={Boolean(issueErrors.bookId)}
            >
              <option value="">Выберите доступную книгу</option>
              {books
                .filter((book) => book.availableCopies > 0)
                .map((book) => (
                  <option value={book.id} key={book.id}>
                    {book.title} · доступно {book.availableCopies}
                  </option>
                ))}
            </select>
            {issueErrors.bookId && <small className="field-error">{issueErrors.bookId}</small>}
          </label>
          <label className="form-field days-field">
            <span>Срок, дней *</span>
            <input
              className="text-input"
              type="number"
              min="1"
              step="1"
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value));
                setIssueErrors((current) => ({ ...current, days: undefined }));
              }}
              aria-invalid={Boolean(issueErrors.days)}
            />
            {issueErrors.days && <small className="field-error">{issueErrors.days}</small>}
          </label>
          <button className="button button-primary issue-button" disabled={saving || loading}>
            {saving ? 'Оформляем...' : 'Выдать книгу'}
            <ArrowDownRight size={16} />
          </button>
        </form>
      </section>

      <div className="loans-toolbar">
        <div className="tabs">
          <button
            className={tab === 'active' ? 'tab active' : 'tab'}
            onClick={() => setTab('active')}
          >
            Активные <span>{active.length}</span>
          </button>
          <button
            className={tab === 'debtors' ? 'tab active' : 'tab'}
            onClick={() => setTab('debtors')}
          >
            Должники <span>{debtors.length}</span>
          </button>
          <button
            className={tab === 'history' ? 'tab active' : 'tab'}
            onClick={() => setTab('history')}
          >
            История
          </button>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Студент или книга" />
      </div>

      <div className="panel table-panel">
        {loading ? (
          <div className="loading-panel">Загружаем выдачи...</div>
        ) : loadError ? (
          <EmptyState title="Не удалось загрузить операции" description={loadError} />
        ) : tab === 'debtors' ? (
          visibleDebtors.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Студент</th>
                    <th>Просроченные книги / долги</th>
                    <th>Неоплаченные штрафы</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDebtors.map((debtor) => {
                    const student = studentMap.get(debtor.studentId);
                    const unpaidLoans = debtor.loans.filter(
                      (loan) => loan.fine > 0 && !loan.finePaid,
                    );
                    return (
                      <tr key={debtor.studentId}>
                        <td>
                          <div className="loan-person-book">
                            <strong>{student?.fullName || 'Студент'}</strong>
                            <span>{student?.group || student?.email || ''}</span>
                          </div>
                        </td>
                        <td>
                          <div className="loan-person-book">
                            <strong>{loansLabel(debtor.loans.length)}</strong>
                            <span>
                              {debtor.loans
                                .map((loan) => bookMap.get(loan.bookId)?.title || 'Книга')
                                .join(', ')}
                            </span>
                          </div>
                        </td>
                        <td>
                          <strong>{formatMoney(debtor.unpaidFineTotal)}</strong>
                        </td>
                        <td>
                          <div className="table-actions">
                            {unpaidLoans.map((loan) => (
                              <button
                                key={loan.id}
                                className="icon-button success-icon"
                                title={`Отметить штраф за «${bookMap.get(loan.bookId)?.title || 'книгу'}» оплаченным`}
                                aria-label={`Оплатить штраф по выдаче ${loan.id}`}
                                onClick={() => setConfirmPay(loan)}
                              >
                                <Check size={17} />
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Должников нет"
              description="Нет активных просрочек или неоплаченных штрафов по найденным студентам."
            />
          )
        ) : visible.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Студент / книга</th>
                  <th>Выдана</th>
                  <th>Вернуть до</th>
                  <th>Статус</th>
                  <th>Штраф</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((loan) => {
                  const due = loanDueState(loan);
                  return (
                    <tr key={loan.id}>
                      <td>
                        <div className="loan-person-book">
                          <strong>{studentMap.get(loan.studentId)?.fullName || 'Студент'}</strong>
                          <span>{bookMap.get(loan.bookId)?.title || 'Книга'}</span>
                        </div>
                      </td>
                      <td>{formatDate(loan.issuedAt)}</td>
                      <td>{formatDate(loan.dueAt)}</td>
                      <td>
                        <span className={`status-pill status-${due.className}`}>
                          {loan.status === 'RETURNED' ? 'Возвращена' : due.label}
                        </span>
                      </td>
                      <td>
                        {loan.fine ? (
                          <div className="fine-cell">
                            <strong>{formatMoney(loan.fine)}</strong>
                            <span>{loan.finePaid ? 'Оплачен' : 'Не оплачен'}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {loan.status !== 'RETURNED' && (
                            <button
                              className="button button-ghost button-small"
                              onClick={() => setConfirmReturn(loan)}
                            >
                              Принять возврат
                            </button>
                          )}
                          {loan.fine > 0 && !loan.finePaid && (
                            <button
                              className="icon-button success-icon"
                              title="Отметить оплату"
                              aria-label="Отметить оплату"
                              onClick={() => setConfirmPay(loan)}
                            >
                              <Check size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={tab === 'history' ? 'История пока пуста' : 'Активных выдач нет'}
            description="Когда появятся операции, они будут отображаться здесь."
          />
        )}
      </div>

      {confirmReturn && (
        <ConfirmDialog
          title="Принять возврат книги?"
          message={`Подтвердите возврат «${bookMap.get(confirmReturn.bookId)?.title || 'книги'}». Итоговый штраф рассчитывается сервером.`}
          confirmText="Принять возврат"
          onCancel={() => setConfirmReturn(null)}
          onConfirm={returnBook}
          busy={actionSaving}
        />
      )}
      {confirmPay && (
        <ConfirmDialog
          title="Отметить штраф оплаченным?"
          message={`Сумма штрафа: ${formatMoney(confirmPay.fine)}. После подтверждения статус будет обновлён.`}
          confirmText="Штраф оплачен"
          onCancel={() => setConfirmPay(null)}
          onConfirm={payFine}
          busy={actionSaving}
        />
      )}
    </div>
  );
}
