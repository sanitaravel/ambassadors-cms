import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LoginPage } from '../../pages/LoginPage';

// --- Mocks ---

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  login: mockLogin,
  isAuthenticated: false,
  isLoading: false,
}));

vi.mock('../../context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetRedirectPath = vi.fn(() => null);
const mockClearRedirectPath = vi.fn();
vi.mock('../../utils/redirect-store', () => ({
  getRedirectPath: () => mockGetRedirectPath(),
  clearRedirectPath: () => mockClearRedirectPath(),
}));

// --- Helpers ---

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

// --- Tests ---

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders email field, password field, and submit button', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows validation error when fields are empty on submit', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText('Email and password are required.'),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('redirects to dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('redirects to stored path on successful login when redirect path exists', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    mockGetRedirectPath.mockReturnValueOnce('/events');

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/events', { replace: true });
      expect(mockClearRedirectPath).toHaveBeenCalled();
    });
  });

  it('shows error message on auth failure and clears password', async () => {
    mockLogin.mockRejectedValueOnce({ status: 401, message: 'Invalid email or password.' });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText('Invalid email or password.'),
    ).toBeInTheDocument();

    // Email retained, password cleared
    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
  });

  it('shows network error message and retains both fields', async () => {
    mockLogin.mockRejectedValueOnce({ status: 0, message: 'Network Error' });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'mypassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText('Service is unreachable. Please check your connection.'),
    ).toBeInTheDocument();

    // Both fields retained
    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('mypassword');
  });

  it('shows loading state during submission', async () => {
    // Make login hang so we can observe the submitting state
    mockLogin.mockImplementationOnce(
      () => new Promise(() => {}), // never resolves
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });
  });

  it('redirects authenticated user away from login without rendering form', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: true,
      isLoading: false,
    });

    renderLoginPage();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('renders nothing while session is loading', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: true,
    });

    const { container } = renderLoginPage();

    expect(container).toBeEmptyDOMElement();
  });
});
