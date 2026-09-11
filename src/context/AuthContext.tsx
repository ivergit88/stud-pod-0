import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export interface User {
  id: string;
  uid: string;
  email: string;
  role: 'student' | 'organization' | 'admin';
  firstName: string;
  lastName: string;
  middleName?: string;
  name: string;
  points: number;
  university?: string;
  course?: number;
  description?: string;
  skills?: string[];
  createdAt: string;
  inn?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isExpertMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  enterExpertMode: (role?: 'student' | 'organization') => Promise<void>;
  switchExpertRole: (role: 'student' | 'organization') => void;
  registerUser: (
    role: 'student' | 'organization',
    additionalData: Partial<User> & Record<string, unknown>,
    password?: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const EXPERT_MODE_KEY = 'stud-pod-expert-role';

const createExpertUser = (role: 'student' | 'organization'): User => ({
  id: role === 'student' ? 'expert-student' : 'expert-organization',
  uid: role === 'student' ? 'expert-student' : 'expert-organization',
  email: 'expert@local.test',
  role,
  firstName: role === 'student' ? 'Эксперт' : '',
  lastName: role === 'student' ? 'Тестовый' : '',
  name: role === 'student' ? 'Эксперт Тестовый' : 'Тестовое учреждение культуры',
  points: 120,
  university: role === 'student' ? 'Тестовый университет' : '',
  course: role === 'student' ? 2 : undefined,
  description: 'Локальный профиль для демонстрации интерфейса платформы.',
  skills: role === 'student' ? ['Дизайн', 'Контент', 'Веб-разработка'] : [],
  createdAt: new Date().toISOString(),
  inn: role === 'organization' ? '0000000000' : '',
  address: role === 'organization' ? 'Нижний Новгород' : '',
  contactPerson: role === 'organization' ? 'Эксперт' : '',
  phone: role === 'organization' ? '+7 900 000-00-00' : '',
  status: 'active',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpertMode, setIsExpertMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const expertRole = window.localStorage.getItem(EXPERT_MODE_KEY);
      if (expertRole === 'student' || expertRole === 'organization') {
        setIsExpertMode(true);
        setUser(createExpertUser(expertRole));
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest<{ user: User | null }>('/api/auth/me');
        if (mounted) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    window.localStorage.removeItem(EXPERT_MODE_KEY);
    setIsExpertMode(false);
    const data = await apiRequest<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    setUser(data.user);
  };

  const logout = async () => {
    if (isExpertMode) {
      window.localStorage.removeItem(EXPERT_MODE_KEY);
      setIsExpertMode(false);
      setUser(null);
      return;
    }

    await apiRequest<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    });

    setUser(null);
  };

  const enterExpertMode = async (role: 'student' | 'organization' = 'organization') => {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    window.localStorage.setItem(EXPERT_MODE_KEY, role);
    setIsExpertMode(true);
    setUser(createExpertUser(role));
  };

  const switchExpertRole = (role: 'student' | 'organization') => {
    if (!isExpertMode) {
      return;
    }

    window.localStorage.setItem(EXPERT_MODE_KEY, role);
    setUser(createExpertUser(role));
  };

  const registerUser = async (
    role: 'student' | 'organization',
    additionalData: Partial<User> & Record<string, unknown>,
    password?: string,
  ) => {
    const data = await apiRequest<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        role,
        additionalData,
        password,
      }),
    });

    window.localStorage.removeItem(EXPERT_MODE_KEY);
    setIsExpertMode(false);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isExpertMode, login, logout, enterExpertMode, switchExpertRole, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
