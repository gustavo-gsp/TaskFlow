# 🎨 Integração Frontend - Sistema de Autenticação

## Exemplo de Serviço de Autenticação (React/TypeScript)

```typescript
// src/services/auth.service.ts

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authService = {
  /**
   * Registrar novo usuário
   */
  async register(data: RegisterData): Promise<{ user: User }> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Importante para enviar/receber cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao registrar');
    }

    return response.json();
  },

  /**
   * Fazer login
   */
  async login(data: LoginData): Promise<{ user: User }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    return response.json();
  },

  /**
   * Renovar tokens
   */
  async refresh(): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Sessão expirada');
    }

    return response.json();
  },

  /**
   * Fazer logout
   */
  async logout(): Promise<void> {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer logout');
    }
  },

  /**
   * Buscar dados do usuário autenticado
   */
  async getMe(): Promise<{ user: User }> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Não autenticado');
    }

    return response.json();
  },
};
```

## Context de Autenticação (React)

```typescript
// src/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário está autenticado ao carregar a página
  useEffect(() => {
    checkAuth();
  }, []);

  // Configura renovação automática dos tokens a cada 14 minutos
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        authService.refresh().catch(() => {
          // Se falhar, desloga o usuário
          setUser(null);
        });
      }, 14 * 60 * 1000); // 14 minutos

      return () => clearInterval(interval);
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { user } = await authService.getMe();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { user } = await authService.login({ email, password });
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { user } = await authService.register({ name, email, password });
    setUser(user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
```

## Componente de Login

```typescript
// src/pages/Login.tsx

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Registre-se
          </a>
        </p>
      </div>
    </div>
  );
};
```

## Rota Protegida

```typescript
// src/components/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## Configuração do Router

```typescript
// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Interceptor para Auto-Refresh

```typescript
// src/utils/api.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Wrapper para fetch com auto-refresh de token
 */
export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Se receber 401, tenta renovar o token
  if (response.status === 401) {
    try {
      await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      // Tenta novamente a requisição original
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } catch {
      // Se falhar, redireciona para login
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
  }

  return response;
};
```

## Variáveis de Ambiente (.env no frontend)

```bash
# frontend/.env
VITE_API_URL=http://localhost:3000
```

## Resumo

1. ✅ **authService**: Funções para chamar a API
2. ✅ **AuthContext**: Gerenciamento global de estado de autenticação
3. ✅ **Auto-refresh**: Tokens são renovados automaticamente a cada 14 minutos
4. ✅ **Rotas protegidas**: Componente `ProtectedRoute` para proteger páginas
5. ✅ **Cookies automáticos**: `credentials: 'include'` envia cookies em cada request
6. ✅ **Error handling**: Tratamento de erros e redirecionamento

**Importante**: Use sempre `credentials: 'include'` em todas as requisições para que os cookies sejam enviados!
