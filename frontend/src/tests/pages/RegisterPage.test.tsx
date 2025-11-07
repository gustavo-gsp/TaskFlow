import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { RegisterPage } from '../../pages/RegisterPage';

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
const mockRegister = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render registration form', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByRole('heading', { name: /criar conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    await user.click(submitButton);

    await waitFor (() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^senha$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');

    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/as senhas não coincidem/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nome/i);
    await user.type(nameInput, 'J');

    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nome deve ter no mínimo 2 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const emailInput = screen.getByLabelText(/^email$/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('should call register mutation with valid data', async () => {
    const user = userEvent.setup();
    mockRegister.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^senha$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister)?.toHaveBeenCalled();
    });
  });

  it('should have accessible form fields', () => {
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^senha$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);

    expect(nameInput).toHaveAttribute('type', 'text');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should have link to login page', () => {
    renderWithProviders(<RegisterPage />);

    const loginLink = screen.getByRole('link', { name: /faça login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
