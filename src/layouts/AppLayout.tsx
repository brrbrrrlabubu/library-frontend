import {
  ArrowLeftRight,
  BookMarked,
  BookOpen,
  GraduationCap,
  Info,
  LayoutDashboard,
  Library,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  Tags,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { libraryInfo } from '../config';

const adminLinks = [
  { to: '/admin', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/admin/books', label: 'Книги', icon: BookOpen, end: false },
  { to: '/admin/categories', label: 'Категории', icon: Tags, end: false },
  { to: '/admin/students', label: 'Студенты', icon: GraduationCap, end: false },
  { to: '/admin/loans', label: 'Выдача и возврат', icon: ArrowLeftRight, end: false },
];

const roleLabels: Record<string, string> = {
  STUDENT: 'Студент',
  ADMIN: 'Администратор',
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('library_theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('library_theme', dark ? 'dark' : 'light');
  }, [dark]);
  const closeMenu = () => setMenuOpen(false);
  const onLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };
  return (
    <div className="scene">
      <div className="app-shell">
        <div
          className={`sidebar-overlay ${menuOpen ? 'visible' : ''}`}
          onClick={closeMenu}
          aria-hidden="true"
        />
        <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-inner">
            <div className="sidebar-head">
              <Link to="/" className="brand" onClick={closeMenu}>
                <span className="brand-mark">
                  <BookOpen size={19} />
                </span>
                <span>
                  libra<span className="brand-dot">.</span>
                </span>
              </Link>
              <button
                className="icon-button sidebar-close"
                aria-label="Закрыть меню"
                onClick={closeMenu}
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="sidebar-user">
                <span className="user-avatar">
                  {user.fullName
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span className="sidebar-user-name">{user.fullName}</span>
                <span className="sidebar-user-role">{roleLabels[user.role] || 'Читатель'}</span>
              </div>
            )}

            <nav className="sidebar-nav">
              <NavLink to="/books" onClick={closeMenu}>
                <BookMarked size={18} />
                Каталог
              </NavLink>
              {user?.role === 'STUDENT' && (
                <NavLink to="/profile" onClick={closeMenu}>
                  <Library size={18} />
                  Мои книги
                </NavLink>
              )}
              {user?.role === 'ADMIN' && (
                <div className="nav-group">
                  <div className="nav-group-label">Администрирование</div>
                  {adminLinks.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMenu}>
                      <item.icon size={17} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
              <a href="#about" onClick={closeMenu}>
                <Info size={18} />О библиотеке
              </a>
            </nav>

            <div className="sidebar-foot">
              {user ? (
                <button className="sidebar-logout" onClick={onLogout}>
                  <LogOut size={17} />
                  Выйти из аккаунта
                </button>
              ) : (
                <Link
                  to="/login"
                  className="button button-primary sidebar-login"
                  onClick={closeMenu}
                >
                  <LogIn size={17} />
                  Войти в аккаунт
                </Link>
              )}
              <div className="sidebar-contacts">
                <span>{libraryInfo.hours}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="shell-main">
          <header className="topbar">
            <div className="topbar-inner">
              <button
                className="icon-button mobile-menu"
                aria-label="Открыть меню"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={21} />
              </button>
              <Link to="/" className="brand brand-mobile">
                <span className="brand-mark">
                  <BookOpen size={18} />
                </span>
                <span>
                  libra<span className="brand-dot">.</span>
                </span>
              </Link>
              <div className="topbar-actions">
                <button
                  className="icon-button theme-button"
                  aria-label="Переключить тему"
                  onClick={() => setDark((value) => !value)}
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                {user ? (
                  <span className="user-chip" title={user.fullName}>
                    <span className="user-avatar">
                      {user.fullName
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <span className="user-name">{user.fullName.split(' ')[0]}</span>
                  </span>
                ) : (
                  <Link to="/login" className="button button-primary button-small topbar-login">
                    <LogIn size={15} />
                    Войти
                  </Link>
                )}
              </div>
            </div>
          </header>
          <main className="main-content">
            <Outlet />
          </main>
          <footer className="footer" id="about">
            <div className="footer-inner">
              <div className="footer-about">
                <Link to="/" className="brand footer-brand">
                  <span className="brand-mark">
                    <BookOpen size={17} />
                  </span>
                  <span>
                    libra<span className="brand-dot">.</span>
                  </span>
                </Link>
                <p>Читать можно онлайн или в зале — мы всегда рады читателям.</p>
              </div>
              <div className="footer-details">
                <span>{libraryInfo.address}</span>
                <span>{libraryInfo.hours}</span>
                <span>{libraryInfo.contact}</span>
              </div>
              <span className="copyright">© 2026 Libra Library</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
