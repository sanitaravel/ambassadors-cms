import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { LoginPage } from '../LoginPage';
import type { ApiError } from '../../api/types';

// Mock auth context
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../context/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../utils/redirect-store', () => ({
  getRedirectPath: vi.fn(() => null),
  clearRedirectPath: vi.fn(),
}));

import * as redirectStore from '../../utils/redirect-store';

const mockGetRedirectPath = vi.mocked(redirectStore.getRedirectPath);
const mockClearRedirectPath = vi.mocked(redirectStore.clearRedirectPath);

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  it('renders email input, password input, and submit button', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('enforces max length of 254 on email input', () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('maxLength', '254');
  });

  it('enforces max length of 128 on password input', () => {
    renderLoginPage();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('maxLength', '128');
  });

  it('styles submit button with accent color #d54407', () => {
    renderLoginPage();
    const button = screen.getByRole('button', { name: /log in/i });
    expect(button).toHaveStyle({ backgroundColor: '#d54407' });
  });

  // Req 1.2: Prevent submission when fields are empty
  it('shows validation error when submitting with empty fields', async () => {
    renderLoginPage();
    const button = screen.getByRole('button', { name: /log in/i });

    fireEvent.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email and password are required.',
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error when email is provided but password is empty', async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email and password are required.',
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // Req 1.3, 11.3: Successful login → redirect to Dashboard
  it('redirects to Dashboard on successful login without stored path', async () => {
    mockGetRedirectPath.mockReturnValue(null);
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'user@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  // Req 11.2: Successful login → redirect to stored path and clear it
  it('redirects to stored path on successful login and clears it', async () => {
    mockGetRedirectPath.mockReturnValue('/events/new');
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/events/new', { replace: true });
    });
    expect(mockClearRedirectPath).toHaveBeenCalled();
  });

  // Req 1.4: Auth error → show error, retain email, clear password
  it('shows error message on auth failure, retains email, clears password', async () => {
    const authError: ApiError = {
      status: 401,
      name: 'UnauthorizedError',
      message: 'Invalid identifier or password',
    };
    mockLogin.mockRejectedValue(authError);
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid identifier or password',
      );
    });

    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
  });

  // Req 1.5: Network error → show "service unreachable", retain both fields
  it('shows service unreachable on network error and retains both fields', async () => {
    const networkError: ApiError = {
      status: 0,
      name: 'NetworkError',
      message: 'Network failure',
    };
    mockLogin.mockRejectedValue(networkError);
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'mypassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Service is unreachable. Please check your connection.',
      );
    });

    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('mypassword');
  });

  // Req 1.6: Disable submit + show loading indicator while request is in progress
  it('disables button and shows loading text while submitting', async () => {
    // Make login hang (never resolve)
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /logging in/i });
      expect(button).toBeDisabled();
    });
  });
});
