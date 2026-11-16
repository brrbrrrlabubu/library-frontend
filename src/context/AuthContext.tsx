import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/services';
import { TOKEN_KEY, USER_KEY } from '../api/http';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

function readStoredUser(): User | null {
  if (!localStorage.getItem(TOKEN_KEY)) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
  try {
    const stored = JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null;
    if (!stored || typeof stored.id !== 'string' || !['STUDENT', 'ADMIN'].includes(stored.role)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [loading, setLoading] = useState(false);
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);
  useEffect(() => {
    const handler = () => {
      logout();
      window.dispatchEvent(
        new CustomEvent('library:toast', {
          detail: { type: 'error', message: 'Сессия истекла. Войдите снова.' },
        }),
      );
      // Client-side navigation keeps the toast mounted and visible.
      navigate('/login', { replace: true });
    };
    window.addEventListener('library:session-expired', handler);
    return () => window.removeEventListener('library:session-expired', handler);
  }, [logout, navigate]);
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      return result.user;
    } finally {
      setLoading(false);
    }
  }, []);
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
