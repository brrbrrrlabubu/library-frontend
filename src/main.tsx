import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { RequireAuth, GuestOnly } from './routes';
import {
  BookDetailPage,
  CatalogPage,
  ForbiddenPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  ProfilePage,
  QRBookPage,
  ReaderPage,
} from './pages/PublicPages';
import {
  AdminBooksPage,
  AdminCategoriesPage,
  AdminLoansPage,
  AdminStudentsPage,
  DashboardPage,
} from './pages/AdminPages';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<CatalogPage />} />
              <Route path="/books/qr/:code" element={<QRBookPage />} />

              <Route element={<GuestOnly />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route path="/books/:id" element={<BookDetailPage />} />

              <Route element={<RequireAuth roles={['STUDENT', 'ADMIN']} />}>
                <Route path="/books/:id/read" element={<ReaderPage />} />
              </Route>

              <Route element={<RequireAuth roles={['STUDENT']} />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              <Route element={<RequireAuth roles={['ADMIN']} />}>
                <Route path="/admin" element={<DashboardPage />} />
                <Route path="/admin/books" element={<AdminBooksPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/loans" element={<AdminLoansPage />} />
                {/* Keep unknown /admin/* paths behind the ADMIN role guard too. */}
                <Route path="/admin/*" element={<NotFoundPage />} />
              </Route>

              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
