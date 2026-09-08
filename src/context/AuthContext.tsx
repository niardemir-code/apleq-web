import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  isAuthCancellation, 
  registerWithEmail, 
  loginWithEmail,
  friendlyAuthErrorMessage
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  registerWithEmailPassword: (email: string, password: string, name: string) => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state error:', err);
        setAuthError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (err: any) {
      // Don't show error banner if user simply closed popup or cancelled permission
      if (!isAuthCancellation(err)) {
        setAuthError(err?.message || 'Error al iniciar sesión con Google');
      }
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      await logoutUser();
    } catch (err: any) {
      setAuthError(err?.message || 'Error al cerrar sesión');
    }
  };

  const registerWithEmailPassword = async (email: string, password: string, name: string) => {
    setAuthError(null);
    await registerWithEmail(email, password, name);
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    setAuthError(null);
    await loginWithEmail(email, password);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        registerWithEmailPassword,
        loginWithEmailPassword,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
