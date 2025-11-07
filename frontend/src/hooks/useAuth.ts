import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';

/**
 * Hook principal de autenticação
 * Gerencia estado de usuário, login, registro e logout
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  /**
   * Query para buscar dados do usuário autenticado
   * Usado para hidratar sessão na inicialização
   */
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await apiClient.getMe();
        return response.user;
      } catch (err) {
        // Se não autenticado (401), retorna null ao invés de erro
        if ((err as Error & { status?: number }).status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false, // Não refaz query ao focar janela
    refetchOnMount: true, // Refaz apenas no mount inicial
  });

  /**
   * Mutation para login
   */
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (response) => {
      // Atualiza cache com dados do usuário
      queryClient.setQueryData(['auth', 'me'], response.user);
      // Redireciona para app
      navigate('/app');
    },
  });

  /**
   * Mutation para registro
   */
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    onSuccess: (response) => {
      // Atualiza cache com dados do usuário
      queryClient.setQueryData(['auth', 'me'], response.user);
      // Redireciona para app
      navigate('/app');
    },
  });

  /**
   * Mutation para logout
   */
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Define explicitamente como null antes de limpar
      queryClient.setQueryData(['auth', 'me'], null);
      // Limpa todos os dados do cache
      queryClient.clear();
      // Redireciona para login
      navigate('/login');
    },
    onError: () => {
      // Mesmo com erro, limpa localmente e redireciona
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      navigate('/login');
    },
  });

  /**
   * Função para tentar refresh de tokens
   * Usado pelo interceptor quando recebe 401
   */
  const refreshTokens = async (): Promise<boolean> => {
    try {
      await apiClient.refresh();
      // Revalida query do usuário após refresh
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      return true;
    } catch {
      // Refresh falhou, limpa cache e redireciona
      queryClient.clear();
      navigate('/login');
      return false;
    }
  };

  return {
    // Estado
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    isError,
    error,

    // Ações
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshTokens,

    // Estados das mutations
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,

    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}

/**
 * Hook simplificado que apenas retorna dados do usuário
 * Útil para componentes que só precisam ler o estado
 */
export function useUser() {
  const { data: user } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    enabled: false, // Não faz fetch, apenas lê cache
  });

  return user;
}
