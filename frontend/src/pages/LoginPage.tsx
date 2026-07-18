import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/auth-context';
import { getRedirectPath, clearRedirectPath } from '../utils/redirect-store';

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Redirect if already authenticated (Req 1.7)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Required-field validation (Req 1.2)
    if (!email.trim() || !password.trim()) {
      setValidationError('Email and password are required.');
      return;
    }

    setValidationError(null);
    setError(null);
    setSubmitting(true);

    try {
      await login({ identifier: email, password });

      // On success, redirect to stored path or Dashboard (Req 11.2, 11.3)
      const redirectPath = getRedirectPath();
      if (redirectPath) {
        clearRedirectPath();
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const apiError = err as { status?: number; message?: string } | undefined;

      if (apiError && apiError.status === 0) {
        // Network error (Req 1.5) — retain both fields
        setError('Service is unreachable. Please check your connection.');
      } else {
        // Auth error (Req 1.4) — retain email, clear password
        setError(
          apiError?.message || 'Invalid email or password.',
        );
        setPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Show nothing while session is restoring
  if (isLoading) {
    return null;
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <h1 style={styles.title}>Login</h1>

        <label htmlFor="login-email" style={styles.label}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
          disabled={submitting}
        />

        <label htmlFor="login-password" style={styles.label}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="current-password"
          disabled={submitting}
        />

        {validationError && (
          <p role="alert" style={styles.errorText}>
            {validationError}
          </p>
        )}

        {error && (
          <p role="alert" style={styles.errorText}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            ...styles.button,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '400px',
    gap: '0.75rem',
  },
  title: {
    fontSize: '1.75rem',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  input: {
    padding: '0.625rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    outline: 'none',
  },
  errorText: {
    color: '#c0392b',
    fontSize: '0.875rem',
    margin: 0,
  },
  button: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#d54407',
    border: 'none',
    borderRadius: '4px',
  },
};
