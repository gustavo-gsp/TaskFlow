import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { LoginPage } from '../../pages/LoginPage';

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock do useAuth
const mockLogin = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /entrar na sua conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'short');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/senha deve ter no mínimo 8 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should call login mutation with valid data', async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('should have accessible form fields', () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(emailInput).toHaveAttribute('id');
    expect(passwordInput).toHaveAttribute('id');
  });

  it('should have link to register page', () => {
    renderWithProviders(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /criar uma nova conta/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
