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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (
    role: 'student' | 'organization',
    additionalData: Partial<User> & Record<string, unknown>,
    password?: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
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
    await apiRequest<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    });

    setUser(null);
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

    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerUser }}>
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
