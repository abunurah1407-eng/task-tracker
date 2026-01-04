import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithAD: (username: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and validate
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Token exists, try to decode and set user
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setUser({
            id: payload.id?.toString() || '',
            email: payload.email || '',
            name: payload.name || '',
            role: (payload.role || 'engineer') as UserRole,
            engineerName: payload.engineerName || null,
            createdAt: new Date().toISOString(),
          });
        } else {
          // Invalid token format, clear it
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        // Invalid token, clear it
        console.warn('Invalid token, clearing:', error);
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser({
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as UserRole,
        engineerName: data.user.engineerName,
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const loginWithAD = async (username: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await api.loginAD(username);
      setUser({
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as UserRole,
        engineerName: data.user.engineerName,
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('AD Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    api.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithAD,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

