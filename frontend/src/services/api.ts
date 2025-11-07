import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshResponse,
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Cliente HTTP para fazer requisições à API
 * Sempre inclui credentials (cookies) nas requisições
 */
class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Tenta renovar tokens quando recebe 401
   */
  private async handleUnauthorized(): Promise<void> {
    // Se já está fazendo refresh, aguarda o atual
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Marca que está fazendo refresh e cria promise
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log('[ApiClient] Tentando renovar tokens...');
        await this.refresh();
        console.log('[ApiClient] Tokens renovados com sucesso');
      } catch (error) {
        console.error('[ApiClient] Erro ao renovar tokens:', error);
        // Se refresh falhar, limpa o estado e propaga erro
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Método genérico para fazer requisições
   * Com interceptor 401 e retry automático após refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuth = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      credentials: 'include', // IMPORTANTE: envia cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Lista de rotas que não devem tentar refresh quando recebem 401
      const noRefreshRoutes = ['/auth/refresh', '/auth/logout', '/auth/login', '/auth/register'];
      const shouldSkipRefresh = noRefreshRoutes.some(route => endpoint.includes(route));

      // Se for erro 401 e não é uma rota de auth, tenta renovar tokens
      if (response.status === 401 && retryOnAuth && !shouldSkipRefresh) {
        console.log('[ApiClient] Recebeu 401, tentando refresh...');
        
        try {
          await this.handleUnauthorized();
          // Após refresh bem-sucedido, refaz a requisição original (uma vez)
          console.log('[ApiClient] Refazendo requisição original após refresh');
          return this.request<T>(endpoint, options, false); // retryOnAuth = false para evitar loop
        } catch {
          // Se refresh falhou, propaga erro 401
          const error = new Error('Sessão expirada') as Error & { status: number };
          error.status = 401;
          throw error;
        }
      }

      // Para outros erros, tenta extrair mensagem da API
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro na requisição');
      }

      // Se for 204 No Content, retorna objeto vazio
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      // Se for NetworkError ou qualquer outro erro, propaga
      throw error;
    }
  }

  /**
   * Registrar novo usuário
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Fazer login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Renovar tokens (silent refresh)
   */
  async refresh(): Promise<RefreshResponse> {
    return this.request<RefreshResponse>('/auth/refresh', {
      method: 'POST',
    });
  }

  /**
   * Fazer logout
   */
  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Buscar dados do usuário autenticado
   */
  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me', {
      method: 'GET',
    });
  }

  /**
   * Verifica saúde da API
   */
  async health(): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/health', {
      method: 'GET',
    });
  }
}

// Exporta instância única do cliente
export const apiClient = new ApiClient(API_BASE_URL);

// Exporta também a classe para testes
export { ApiClient };
