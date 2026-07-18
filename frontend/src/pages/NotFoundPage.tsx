import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        style={{
          color: '#d54407',
          textDecoration: 'underline',
          fontSize: '1rem',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
