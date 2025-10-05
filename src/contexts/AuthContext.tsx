import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, AuthUser, Session } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async (): Promise<void> => {
      try {
        const { user: currentUser, error } = await AuthService.getCurrentUser();
        if (mounted) {
          if (currentUser && !error) {
            setUser(currentUser);
            setSession({ user: currentUser } as Session);
          }
          setInitializing(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setInitializing(false);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (mounted) {
          console.log('Auth state changed:', event, session?.user?.email);
          
          if (session?.user) {
            setUser(session.user);
            setSession(session);
            // Cache user data
            await AsyncStorage.setItem('user', JSON.stringify(session.user));
          } else {
            setUser(null);
            setSession(null);
            // Clear cached user data
            await AsyncStorage.removeItem('user');
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    userData: { fullName?: string } = {}
  ) => {
    setLoading(true);
    try {
      console.log('🔄 Attempting sign up for:', email);
      const result = await AuthService.signUp(email, password, userData);
      console.log('✅ Sign up result:', { 
        user: result.user?.email, 
        error: result.error instanceof Error ? result.error.message : result.error
      });
      if (result.error) {
        throw result.error;
      }
      return result;
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔄 Attempting sign in for:', email);
      const result = await AuthService.signIn(email, password);
      console.log('✅ Sign in result:', { 
        user: result.user?.email, 
        error: result.error instanceof Error ? result.error.message : result.error
      });
      if (result.error) {
        throw result.error;
      }
      return result;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await AuthService.signOut();
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;