import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider de autenticação
 * Gerencia estado global e silent refresh automático
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const refreshTimerRef = useRef<number | null>(null);

  /**
   * Silent refresh automático
   * Tenta renovar tokens a cada 10 minutos (antes do access token expirar aos 15min)
   */
  useEffect(() => {
    if (!auth.isAuthenticated) {
      // Limpa timer se não estiver autenticado
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    // Configura timer para refresh automático
    // Executa a cada 10 minutos (600000ms)
    refreshTimerRef.current = window.setInterval(() => {
      console.log('[AuthProvider] Silent refresh automático');
      auth.refreshTokens().catch((err) => {
        console.error('[AuthProvider] Erro no silent refresh:', err);
      });
    }, 10 * 60 * 1000); // 10 minutos

    // Cleanup ao desmontar ou quando autenticação mudar
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [auth.isAuthenticated, auth]);

  const value: AuthContextValue = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    refreshTokens: auth.refreshTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar o contexto de autenticação
 * Deve ser usado dentro de um AuthProvider
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
}
