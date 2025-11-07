import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';

/**
 * Cria um QueryClient para testes com configurações apropriadas
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper com todos os providers necessários para os testes
 */
export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Render customizado que inclui todos os providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Mock de resposta da API
 */
export function mockApiResponse<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as Response);
}

/**
 * Mock de erro da API
 */
export function mockApiError(message: string, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    headers: new Headers(),
  } as Response);
}

/**
 * Aguarda até que a condição seja verdadeira
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 3000
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout esperando condição');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
