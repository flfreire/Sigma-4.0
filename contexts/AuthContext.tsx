import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockAuthService } from '../services/mockAuthService';
import { dbService } from '../services/dbService';
import { ALL_VIEWS } from '../constants/permissions';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await dbService.openDb();
        const users = await dbService.getAllUsers();
        if (users.length === 0) {
            // Seed the first admin user with full permissions
            await dbService.addUser({ 
                id: 'user-1', 
                name: 'Admin', 
                email: 'admin@sigma.com', 
                password: 'admin123',
                role: UserRole.Admin,
                permissions: ALL_VIEWS,
            });
        }
        
        const storedUser = sessionStorage.getItem('sigma-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to initialize auth or parse user from session storage", e);
        sessionStorage.removeItem('sigma-user');
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await mockAuthService.login(email, password);
      setUser(loggedInUser);
      sessionStorage.setItem('sigma-user', JSON.stringify(loggedInUser));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      throw e; // re-throw for the form to handle it
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await mockAuthService.register(name, email, password);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      throw e; // re-throw for the form to handle it
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('sigma-user');
  };
  
  const clearError = () => {
      setError(null);
  }

  const value = { user, login, logout, register, isLoading, error, clearError };

  // Render children only when initial session check is complete
  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};