import React, { createContext, useContext, useState } from 'react';

interface Doctor {
  id: string;
  email: string;
  name: string;
  specialty: string;
  clinicName: string;
  phone: string;
  licenseNumber: string;
}

interface AuthContextType {
  doctor: Doctor | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: Omit<Doctor, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Doctor>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock doctor for demo
const mockDoctor: Doctor = {
  id: '1',
  email: 'doctor@clinic.com',
  name: 'د. أحمد محمد',
  specialty: 'طب عام',
  clinicName: 'عيادة الشفاء',
  phone: '01012345678',
  licenseNumber: 'EG-12345',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in real app, this would call Supabase
    if (email && password) {
      setDoctor(mockDoctor);
      return true;
    }
    return false;
  };

  const signup = async (data: Omit<Doctor, 'id'> & { password: string }): Promise<boolean> => {
    // Mock signup - in real app, this would call Supabase
    const newDoctor: Doctor = {
      id: Date.now().toString(),
      email: data.email,
      name: data.name,
      specialty: data.specialty,
      clinicName: data.clinicName,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
    };
    setDoctor(newDoctor);
    return true;
  };

  const logout = () => {
    setDoctor(null);
  };

  const updateProfile = (data: Partial<Doctor>) => {
    if (doctor) {
      setDoctor({ ...doctor, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        doctor,
        isAuthenticated: !!doctor,
        login,
        signup,
        logout,
        updateProfile,
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
