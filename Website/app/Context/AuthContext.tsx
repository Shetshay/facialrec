// app/Context/AuthContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication status...');
      const response = await fetch('http://localhost:3000/api/userCookieInfo', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Auth response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data received:', userData);
        
        if (userData.email) {
          setUser({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName
          });
        } else {
          console.log('No user email in response');
          setUser(null);
        }
      } else {
        console.log('Auth check failed');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Only check auth once on mount and after redirect
  useEffect(() => {
    const path = window.location.pathname;
    // Check if we're on the FaceScreenshot page
    if (path === '/FaceScreenshot') {
      checkAuth();
    }
  }, []);

  // Add another useEffect to monitor user state changes
  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, checkAuth }}>
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