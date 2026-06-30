// src/context/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { apiService } from '../lib/api';
import { User, Customer, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  console.log('✅ AuthProvider rendering (start)');

  const [state, setState] = useState<AuthState>({
    user: null,
    customer: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const isFetchingRef = useRef(false);

  const fetchUserData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const token = apiService.getToken();
      if (!token) {
        setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
        isFetchingRef.current = false;
        return;
      }

      const response = await apiService.getMe();
      let userData = response?.data?.user || response?.user || null;
      const customerData = response?.data?.customer || response?.customer || null;

      if (userData) {
        // ✅ Normalize role to lowercase for consistent checks
        if (userData.role) userData.role = userData.role.toLowerCase();
        setState({
          user: userData,
          customer: customerData,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        apiService.removeToken();
        setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      apiService.removeToken();
      setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = apiService.getToken();
    if (token) {
      await fetchUserData();
    }
  }, [fetchUserData]);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = apiService.getToken();
        if (token) {
          await fetchUserData();
        } else {
          if (isMounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        if (isMounted) {
          setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
        }
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, [fetchUserData]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    console.log('🔑 login() called');
    try {
      setState(prev => ({ ...prev, isLoading: true, isAuthenticated: false }));
      const response = await apiService.login(email, password);
      let token: string | undefined;
      let user: any;
      let customer: any;

      if (response?.token && response?.user) {
        token = response.token;
        user = response.user;
        customer = response.customer || null;
      } else if (response?.data?.token && response?.data?.user) {
        token = response.data.token;
        user = response.data.user;
        customer = response.data.customer || null;
      } else if (response?.access_token && response?.user) {
        token = response.access_token;
        user = response.user;
        customer = response.customer || null;
      } else if (response?.success && response?.data?.token && response?.data?.user) {
        token = response.data.token;
        user = response.data.user;
        customer = response.data.customer || null;
      }

      if (token && user) {
        // ✅ Normalize role to lowercase for consistent checks
        if (user.role) user.role = user.role.toLowerCase();
        apiService.setToken(token);
        setState({
          user: user as User,
          customer: customer as Customer | null,
          isLoading: false,
          isAuthenticated: true,
        });
        return { error: null };
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return { error: 'Invalid login response' };
    } catch (err: any) {
      console.error('❌ Login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      if (err.response?.data?.error) errorMessage = err.response.data.error;
      else if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.message) errorMessage = err.message;
      setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
      return { error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiService.removeToken();
      setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
    }
  };

  console.log('✅ AuthProvider providing context, state:', state);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  console.log('🔍 useAuth called');
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('⚠️ useAuth called outside AuthProvider – returning fallback');
    // ✅ Return a safe fallback so components never crash
    return {
      user: null,
      customer: null,
      isLoading: true,
      isAuthenticated: false,
      login: async () => ({ error: 'Auth provider not initialized' }),
      logout: async () => {},
      refreshUser: async () => {},
    };
  }
  return context;
}