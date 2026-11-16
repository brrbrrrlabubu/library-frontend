import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  MapPin,
  Search,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { authService, libraryService, studentService, USE_MOCKS } from '../api/services';
import { PageHeading, BookCard, EmptyState } from '../components/Shared';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate, booksLabel, formatMoney, loanDueState } from '../utils/format';
import type { Book, Category, Loan } from '../types';
import { libraryInfo } from '../config';

export function HomePage() {
  const { notify } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookError, setBookError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.allSettled([libraryService.getAllBooks(), libraryService.getCategories()])
      .then(([bookResult, categoryResult]) => {
        if (!active) return;
        if (bookResult.status === 'fulfilled') {
          setBooks(
            [...bookResult.value].sort(
              (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
            ),
          );
        } else {
          const message =
            bookResult.reason instanceof Error
              ? bookResult.reason.message
              : 'Не удалось загрузить подборку книг';
          setBookError(message);
          notify(message, 'error');
        }
        if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value);
        else
          notify(
            categoryResult.reason instanceof Error
              ? categoryResult.reason.message
              : 'Не удалось загрузить категории',
            'error',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [notify]);
  const popular = books.filter((book) => book.popular).slice(0, 3);
  const latest = books.slice(0, 3);
  const featured = popular[0] || latest[0];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">Онлайн-библиотека</div>
          <h1>
            Книги, которые
            <br />
            <em>хочется читать.</em>
          </h1>
          <p>
            Каталог библиотеки, поиск по названию и автору, онлайн-чтение и личный кабинет — всё в
            одном месте.
          </p>
          <div className="hero-actions">
            <Link to="/books" className="button button-primary">
              Перейти в каталог <ArrowRight size={17} />
            </Link>
            <span className="hero-note">
              <BookOpen size={16} /> Чтение доступно студентам
            </span>
          </div>
        </div>
        <div className="hero-art">
          {featured ? (
            <Link to={`/books/${featured.id}`} className="hero-book-card">
              <div className="hero-book-cover">
                <img src={featured.cover} alt={`Обложка книги «${featured.title}»`} />
              </div>
              <strong>{featured.title}</strong>
              <span>{featured.author}</span>
            </Link>
          ) : (
            <div className="hero-book-card hero-book-placeholder">
              <div className="hero-book-cover">
                <BookOpen size={42} />
              </div>
              <strong>Новые книги уже в каталоге</strong>
              <span>Заглядывайте почаще</span>
            </div>
          )}
        </div>
      </section>
      <section className="stats-strip">
        <div>
          <strong>Каталог</strong>
          <span>Поиск и фильтры</span>
        </div>
        <div>
          <strong>Онлайн</strong>
          <span>Чтение в браузере</span>
        </div>
        <div>
          <strong>Кабинет</strong>
          <span>Книги и сроки</span>
        </div>
        <div>
          <strong>QR-код</strong>
          <span>Быстрый путь к книге</span>
        </div>
      </section>
      <section className="section-block">
        <div className="section-top">
          <div>
            <div className="eyebrow">Выбор читателей</div>
            <h2>Популярные книги</h2>
          </div>
          <Link to="/books" className="text-link">
            Весь каталог <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="book-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="book-skeleton" key={`popular-skeleton-${index}`} />
            ))}
          </div>
        ) : popular.length ? (
          <div className="book-grid">
            {popular.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                category={categories.find((cat) => cat.id === book.categoryId)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={bookError ? 'Не удалось загрузить подборку' : 'Популярных книг пока нет'}
            description={bookError || 'Подборка появится после добавления популярных изданий.'}
          />
        )}
      </section>
      <section className="quote-section">
        <div className="quote-mark">“</div>
        <blockquote>Книга — это мечта, которую вы держите в руках.</blockquote>
        <span>— Нил Гейман</span>
      </section>
      <section className="section-block section-latest">
        <div className="section-top">
          <div>
            <div className="eyebrow">Недавно в библиотеке</div>
            <h2>Новые поступления</h2>
          </div>
          <Link to="/books" className="text-link">
            Смотреть все <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="book-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="book-skeleton" key={`latest-skeleton-${index}`} />
            ))}
          </div>
        ) : latest.length ? (
          <div className="book-grid">
            {latest.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                category={categories.find((cat) => cat.id === book.categoryId)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              bookError ? 'Не удалось загрузить новые поступления' : 'Новых поступлений пока нет'
            }
            description={bookError || 'Новые книги появятся здесь после добавления в каталог.'}
          />
        )}
      </section>
      <section className="library-info">
        <div className="library-info-copy">
          <div className="eyebrow">Как нас найти</div>
          <h2>
            Загляните за новой книгой —<br />
            <em>или откройте её онлайн.</em>
          </h2>
          <p>
            Приходите в читальный зал или выберите книгу в каталоге и начните читать прямо в
            браузере.
          </p>
          <Link to="/books" className="button button-primary">
            Найти свою книгу <ArrowRight size={17} />
          </Link>
        </div>
        <div className="library-info-card">
          <div className="info-line">
            <MapPin size={19} />
            <div>
              <strong>Наш адрес</strong>
              <span>{libraryInfo.address}</span>
            </div>
          </div>
          <div className="info-line">
            <Clock3 size={19} />
            <div>
              <strong>Часы работы</strong>
              <span>{libraryInfo.hours}</span>
            </div>
          </div>
          <div className="info-line">
            <Mail size={19} />
            <div>
              <strong>Связаться с нами</strong>
              <span>{libraryInfo.contact}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 400);
  const { notify } = useToast();
  useEffect(() => {
    let active = true;
    libraryService
      .getCategories()
      .then((items) => {
        if (active) setCategories(items);
      })
      .catch((error: Error) => {
        if (active) notify(error.message || 'Не удалось загрузить категории', 'error');
      });
    return () => {
      active = false;
    };
  }, [notify]);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    libraryService
      .getBooks({ search: debouncedSearch, categoryId, sort, page, limit: 6 })
      .then((result) => {
        if (!active) return;
        setBooks(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      })
      .catch((error: Error) => {
        if (!active) return;
        setBooks([]);
        setLoadError(error.message || 'Не удалось загрузить каталог');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, categoryId, sort, page]);
  return (
    <div className="content-wrap">
      <PageHeading
        eyebrow="Библиотечный фонд"
        title="Каталог книг"
        description="Исследуйте коллекцию, находите нужные издания и открывайте новые темы."
      />
      <div className="catalog-toolbar">
        <label className="search-field catalog-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Название книги или автор"
            aria-label="Поиск по названию или автору"
          />
        </label>
        <select
          className="select-field"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          aria-label="Категория"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="select-field"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
          aria-label="Сортировка"
        >
          <option value="newest">Сначала новые</option>
          <option value="title">По названию</option>
        </select>
      </div>
      <div className="results-line">
        <span>{booksLabel(total)}</span>
        <span>Категории · {categories.length}</span>
      </div>
      {loading ? (
        <div className="book-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="book-skeleton" key={index} />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState title="Не удалось загрузить каталог" description={loadError} />
      ) : books.length ? (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              category={categories.find((category) => category.id === book.categoryId)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="По вашему запросу ничего не найдено"
          description="Попробуйте изменить поисковую фразу или выбрать другую категорию."
        />
      )}
      <div className="pagination">
        <button
          className="button button-ghost button-small"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          <ArrowLeft size={15} />
          Назад
        </button>
        <span>
          Страница {page} из {totalPages}
        </span>
        <button
          className="button button-ghost button-small"
          disabled={page >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Далее
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function BookInfo({ book, category }: { book: Book; category?: Category }) {
  const { user } = useAuth();
  return (
    <div className="book-detail-layout">
      <div className="detail-cover">
        <img src={book.cover} alt={`Обложка книги «${book.title}»`} />
      </div>
      <div className="detail-copy">
        <div className="eyebrow">{category?.name || 'Книжная коллекция'}</div>
        <h1>{book.title}</h1>
        <p className="detail-author">{book.author}</p>
        <p className="detail-description">{book.description}</p>
        <div className="detail-availability">
          <span className={book.availableCopies > 0 ? 'availability' : 'availability unavailable'}>
            <i />
            {book.availableCopies > 0
              ? `${book.availableCopies} экземпляров доступно`
              : 'Все экземпляры выданы'}
          </span>
          <span>Всего в фонде: {book.totalCopies}</span>
        </div>
        {user ? (
          <Link to={`/books/${book.id}/read`} className="button button-primary">
            Читать онлайн <BookOpen size={17} />
          </Link>
        ) : (
          <Link to="/login" className="button button-primary">
            Войдите, чтобы читать онлайн <LogIn size={17} />
          </Link>
        )}
        <div className="detail-meta">
          <span>Код издания</span>
          <strong>{book.code}</strong>
          <span>Добавлена</span>
          <strong>{formatDate(book.createdAt)}</strong>
        </div>
      </div>
    </div>
  );
}

export function BookDetailPage() {
  const { notify } = useToast();
  const { id = '' } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [category, setCategory] = useState<Category>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setBook(null);
    setError('');
    setCategory(undefined);
    libraryService
      .getBook(id)
      .then((item) => {
        if (!active) return;
        setBook(item);
        libraryService
          .getCategories()
          .then((cats) => {
            if (active) setCategory(cats.find((cat) => cat.id === item.categoryId));
          })
          .catch((error: Error) => {
            if (active) notify(error.message || 'Не удалось загрузить категории', 'error');
          });
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [id, notify]);
  if (error)
    return (
      <div className="content-wrap">
        <EmptyState title={error} />
        <Link to="/books" className="button button-primary">
          Вернуться в каталог
        </Link>
      </div>
    );
  if (!book)
    return (
      <div className="content-wrap">
        <div className="loading-panel">Загружаем книгу...</div>
      </div>
    );
  return (
    <div className="content-wrap">
      <Link to="/books" className="back-link">
        <ArrowLeft size={16} />К каталогу
      </Link>
      <BookInfo book={book} category={category} />
    </div>
  );
}

export function QRBookPage() {
  const { notify } = useToast();
  const { code = '' } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [category, setCategory] = useState<Category>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setBook(null);
    setError('');
    setCategory(undefined);
    libraryService
      .getBookByQr(code)
      .then((item) => {
        if (!active) return;
        setBook(item);
        libraryService
          .getCategories()
          .then((cats) => {
            if (active) setCategory(cats.find((cat) => cat.id === item.categoryId));
          })
          .catch((error: Error) => {
            if (active) notify(error.message || 'Не удалось загрузить категории', 'error');
          });
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [code, notify]);
  return (
    <div className="content-wrap">
      <div className="qr-public-label">
        <span className="brand-mark">
          <BookOpen size={17} />
        </span>
        <span>Страница книги · Libra</span>
      </div>
      {error ? (
        <EmptyState
          title={error}
          description="Проверьте QR-код или обратитесь к сотруднику библиотеки."
        />
      ) : !book ? (
        <div className="loading-panel">Загружаем информацию об издании...</div>
      ) : (
        <BookInfo book={book} category={category} />
      )}
    </div>
  );
}

export function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(USE_MOCKS ? 'student@library.local' : '');
  const [password, setPassword] = useState(USE_MOCKS ? 'student123' : '');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Введите корректный email');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }
    try {
      const user = await login(email, password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || (user.role === 'ADMIN' ? '/admin' : '/profile'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    }
  };
  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-visual-content">
          <span className="eyebrow">С возвращением</span>
          <h1>
            Продолжите
            <br />с того места, где <em>остановились.</em>
          </h1>
          <p>Войдите, чтобы читать онлайн, видеть сроки возврата и историю выдач.</p>
          <div className="login-visual-note">
            <BookOpen size={18} /> Ваши книги и сроки — всегда перед глазами
          </div>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-panel-inner">
          <div className="eyebrow">Добро пожаловать</div>
          <h2>Войти в аккаунт</h2>
          <p className="muted">Введите данные, выданные библиотекой.</p>
          {error && (
            <div className="inline-alert alert-error">
              <XCircle size={17} />
              {error}
            </div>
          )}
          <form className="form-stack" onSubmit={submit}>
            <label className="form-field">
              <span>Email</span>
              <div className="input-with-icon">
                <Mail size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="username"
                  required
                />
              </div>
            </label>
            <label className="form-field">
              <span>Пароль</span>
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ваш пароль"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>
            <button className="button button-primary button-full" type="submit" disabled={loading}>
              {loading ? 'Выполняется вход...' : 'Войти в библиотеку'}
              <ArrowRight size={17} />
            </button>
          </form>
          {USE_MOCKS && (
            <div className="demo-credentials">
              <strong>Демо-доступ</strong>
              <div>
                <span>Студент</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('student@library.local');
                    setPassword('student123');
                  }}
                >
                  student@library.local · student123
                </button>
              </div>
              <div>
                <span>Администратор</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@library.local');
                    setPassword('admin123');
                  }}
                >
                  admin@library.local · admin123
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReaderPage() {
  const { id = '' } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [page, setPage] = useState('1');
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setBook(null);
    setError('');
    libraryService
      .getBook(id)
      .then((item) => {
        if (active) setBook(item);
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <div className="content-wrap">
        <EmptyState
          title={error}
          description="Не удалось открыть документ. Вернитесь к карточке книги и попробуйте снова."
        />
        <Link to={`/books/${id}`} className="button button-primary">
          К книге
        </Link>
      </div>
    );
  if (!book)
    return (
      <div className="content-wrap">
        <div className="loading-panel">Загружаем документ...</div>
      </div>
    );
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const pdfViewerUrl = new URL(book.pdfUrl, window.location.href);
  pdfViewerUrl.hash = `page=${safePage}&zoom=${zoom}&toolbar=1&navpanes=0`;
  return (
    <div className="reader-page">
      <div className="reader-toolbar">
        <Link to={`/books/${book.id}`} className="back-link">
          <ArrowLeft size={16} />К книге
        </Link>
        <div className="reader-title">
          <strong>{book.title}</strong>
          <span>{book.author}</span>
        </div>
        <div className="reader-controls">
          <label>
            Страница{' '}
            <input
              type="number"
              min="1"
              value={page}
              aria-label="Номер страницы PDF"
              onChange={(event) => setPage(event.target.value)}
            />
          </label>
          <button
            className="icon-button"
            aria-label="Уменьшить масштаб"
            onClick={() => setZoom((value) => Math.max(70, value - 10))}
          >
            −
          </button>
          <span className="zoom-value">{zoom}%</span>
          <button
            className="icon-button"
            aria-label="Увеличить масштаб"
            onClick={() => setZoom((value) => Math.min(150, value + 10))}
          >
            +
          </button>
          <a
            className="button button-ghost button-small"
            href={book.pdfUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={15} />
            PDF
          </a>
        </div>
      </div>
      <div className="pdf-stage">
        {/* The key forces a remount when page/zoom change: browsers do not
            navigate an iframe on a fragment-only src change, so without it the
            built-in PDF viewer would stay on the initial page. */}
        <iframe
          key={pdfViewerUrl.toString()}
          className="pdf-frame"
          title={`Чтение: ${book.title}`}
          src={pdfViewerUrl.toString()}
        />
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [unpaidFineTotal, setUnpaidFineTotal] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    let active = true;
    if (!userId) {
      setProfileLoading(false);
      return () => {
        active = false;
      };
    }

    setProfileLoading(true);
    setProfileError('');
    Promise.all([studentService.getMyLoans(), libraryService.getAllBooks()])
      .then(([summary, allBooks]) => {
        if (!active) return;
        setLoans(summary.items);
        setUnpaidFineTotal(
          typeof summary.unpaidFineTotal === 'number' ? summary.unpaidFineTotal : null,
        );
        setBooks(allBooks);
      })
      .catch((error: Error) => {
        if (!active) return;
        const message = error.message || 'Не удалось загрузить личный кабинет';
        setProfileError(message);
        notify(message, 'error');
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, notify]);

  const bookById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const activeLoans = loans.filter((loan) => loan.status !== 'RETURNED');
  const history = loans.filter((loan) => loan.status === 'RETURNED');

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setPasswordError('');
    const nextErrors: typeof passwordFieldErrors = {};
    if (!currentPassword) nextErrors.currentPassword = 'Введите текущий пароль';
    if (newPassword.length < 8)
      nextErrors.newPassword = 'Пароль должен содержать не менее 8 символов';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Пароли не совпадают';
    setPasswordFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      notify('Пароль успешно изменён');
      setPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFieldErrors({});
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Ошибка смены пароля');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-wrap">
      <PageHeading
        eyebrow="Личный кабинет"
        title={`Здравствуйте, ${user?.fullName.split(' ')[0]}!`}
        description="Здесь собрана информация о ваших книгах, сроках возврата и истории чтения."
        action={
          <button
            className="button button-ghost"
            onClick={() => {
              setPasswordError('');
              setPasswordFieldErrors({});
              setPasswordOpen(true);
            }}
          >
            <KeyRound size={16} />
            Сменить пароль
          </button>
        }
      />
      <div className="profile-summary">
        <div className="profile-user">
          <div className="profile-avatar">
            <UserRound size={25} />
          </div>
          <div>
            <strong>{user?.fullName}</strong>
            <span>
              {user?.email} · {user?.group}
            </span>
          </div>
        </div>
        <div className="profile-metric">
          <span>Книги на руках</span>
          <strong>{profileLoading ? '—' : activeLoans.length}</strong>
        </div>
        <div className="profile-metric">
          <span>Текущие штрафы</span>
          <strong className={unpaidFineTotal ? 'text-danger' : ''}>
            {profileLoading || unpaidFineTotal === null ? '—' : formatMoney(unpaidFineTotal)}
          </strong>
        </div>
      </div>

      {profileLoading ? (
        <div className="loading-panel">Загружаем личный кабинет...</div>
      ) : profileError ? (
        <EmptyState title="Не удалось загрузить данные" description={profileError} />
      ) : (
        <>
          <section className="profile-section">
            <div className="section-top">
              <div>
                <div className="eyebrow">Ваши издания</div>
                <h2>Книги на руках</h2>
              </div>
              <span className="count-pill">{activeLoans.length}</span>
            </div>
            {activeLoans.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Книга</th>
                      <th>Дата выдачи</th>
                      <th>Вернуть до</th>
                      <th>Состояние</th>
                      <th>Штраф</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map((loan) => {
                      const book = bookById.get(loan.bookId);
                      const due = loanDueState(loan);
                      return (
                        <tr key={loan.id}>
                          <td>
                            <div className="table-book">
                              <img
                                src={book?.cover}
                                alt={book ? `Обложка книги ${book.title}` : 'Обложка книги'}
                              />
                              <div>
                                <strong>{book?.title || 'Книга'}</strong>
                                <span>{book?.author}</span>
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(loan.issuedAt)}</td>
                          <td>{formatDate(loan.dueAt)}</td>
                          <td>
                            <span className={`status-pill status-${due.className}`}>
                              {due.label}
                            </span>
                          </td>
                          <td>{loan.fine ? formatMoney(loan.fine) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="У вас пока нет книг"
                description="Выберите интересующее издание в каталоге библиотеки."
              />
            )}
          </section>

          <section className="profile-section">
            <div className="section-top">
              <div>
                <div className="eyebrow">Ваш читательский путь</div>
                <h2>История выдач</h2>
              </div>
            </div>
            {history.length ? (
              <div className="history-list">
                {history.map((loan) => (
                  <div className="history-row" key={loan.id}>
                    <div className="history-icon">
                      <CheckCircle2 size={19} />
                    </div>
                    <div>
                      <strong>{bookById.get(loan.bookId)?.title || 'Книга'}</strong>
                      <span>
                        Выдана {formatDate(loan.issuedAt)} · Возвращена{' '}
                        {loan.returnedAt ? formatDate(loan.returnedAt) : '—'}
                      </span>
                    </div>
                    <span className="status-pill status-success">Возвращена</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="История пока пуста"
                description="Здесь появятся ранее взятые и возвращённые книги."
              />
            )}
          </section>
        </>
      )}

      {passwordOpen && (
        <Modal
          title="Смена пароля"
          onClose={() => {
            if (!saving) setPasswordOpen(false);
          }}
        >
          <form className="form-stack" onSubmit={changePassword} noValidate>
            {passwordError && <div className="inline-alert alert-error">{passwordError}</div>}
            <label className="form-field">
              <span>Текущий пароль</span>
              <input
                className="text-input"
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  setPasswordFieldErrors((current) => ({ ...current, currentPassword: undefined }));
                }}
                aria-invalid={Boolean(passwordFieldErrors.currentPassword)}
                autoComplete="current-password"
                required
              />
              {passwordFieldErrors.currentPassword && (
                <small className="field-error">{passwordFieldErrors.currentPassword}</small>
              )}
            </label>
            <label className="form-field">
              <span>Новый пароль (от 8 символов)</span>
              <input
                className="text-input"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setPasswordFieldErrors((current) => ({ ...current, newPassword: undefined }));
                }}
                aria-invalid={Boolean(passwordFieldErrors.newPassword)}
                minLength={8}
                autoComplete="new-password"
                required
              />
              {passwordFieldErrors.newPassword && (
                <small className="field-error">{passwordFieldErrors.newPassword}</small>
              )}
            </label>
            <label className="form-field">
              <span>Повторите новый пароль</span>
              <input
                className="text-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setPasswordFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                }}
                aria-invalid={Boolean(passwordFieldErrors.confirmPassword)}
                minLength={8}
                autoComplete="new-password"
                required
              />
              {passwordFieldErrors.confirmPassword && (
                <small className="field-error">{passwordFieldErrors.confirmPassword}</small>
              )}
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setPasswordOpen(false)}
                disabled={saving}
              >
                Отмена
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить пароль'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="system-page">
      <div className="system-code">403</div>
      <h1>Доступ ограничен</h1>
      <p>У вашей учётной записи нет прав для просмотра этой страницы.</p>
      <Link className="button button-primary" to="/">
        Вернуться на главную
      </Link>
    </div>
  );
}
export function NotFoundPage() {
  return (
    <div className="system-page">
      <div className="system-code">404</div>
      <h1>Страница не найдена</h1>
      <p>Возможно, адрес изменился или страница была удалена.</p>
      <Link className="button button-primary" to="/">
        На главную
      </Link>
    </div>
  );
}
