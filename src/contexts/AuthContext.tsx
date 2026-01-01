import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { User, UserRole, AssistantPermissions } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDoctor: boolean;
  isAssistant: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  hasPermission: (permission: keyof AssistantPermissions) => boolean;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  specialization?: string;
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = api.getToken();
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        api.logout();
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await api.login(email, password);
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      await api.register(data);
      // After registration, log them in
      return await login(data.email, data.password);
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (permission: keyof AssistantPermissions): boolean => {
    // Doctors have all permissions
    if (user?.role === 'doctor') {
      return true;
    }
    // Check assistant permissions
    return user?.permissions?.[permission] ?? false;
  };

  const isDoctor = user?.role === 'doctor';
  const isAssistant = user?.role === 'assistant';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isDoctor,
        isAssistant,
        login,
        signup,
        logout,
        updateProfile,
        hasPermission,
      }}
    >
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

// Re-export types for convenience
export type { User, UserRole, AssistantPermissions };
