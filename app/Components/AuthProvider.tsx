'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/app/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Get current user data using the token
            authService.setAuthToken(token);
            const response = await authService.getCurrentUser();
            if (response.data) {
              setUser(response.data);
            } else {
              localStorage.removeItem('token');
              authService.setAuthToken(null);
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
            localStorage.removeItem('token');
            authService.setAuthToken(null);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign in function
  const signIn = async (token: string) => {
    try {
      // Store the token
      localStorage.setItem('token', token);
      authService.setAuthToken(token);
      
      // Fetch user data
      const response = await authService.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      localStorage.removeItem('token');
      authService.setAuthToken(null);
      throw error;
    }
  };

  // Sign out function
  const signOut = () => {
    localStorage.removeItem('token');
    authService.setAuthToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Default export for backward compatibility
export default AuthProvider;
