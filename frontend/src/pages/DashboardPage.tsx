import { Link } from 'react-router';
import { useAuth } from '../context/auth-context';
import { getPermittedContentTypes, type ContentType } from '../utils/permissions';
import type { AmbassadorProfile } from '../api/content-types';

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; path: string }> = {
  'activity-clubs': { label: 'Add Activity Club', path: '/activity-clubs/new' },
  'buildings': { label: 'Add Building', path: '/buildings/new' },
  'events': { label: 'Add Event', path: '/events/new' },
  'news-articles': { label: 'Add News Article', path: '/news-articles/new' },
};

export function DashboardPage() {
  const { user, role, profile } = useAuth();

  const permittedTypes = getPermittedContentTypes(role);

  const ambassadorProfile = role === 'ambassador' ? (profile as AmbassadorProfile | null) : null;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome, {user?.username ?? 'User'}</h1>

      <section style={styles.section}>
        <h2 style={styles.subheading}>Quick Actions</h2>
        <div style={styles.cardGrid}>
          {permittedTypes.map((type) => {
            const config = CONTENT_TYPE_CONFIG[type];
            return (
              <Link key={type} to={config.path} style={styles.card}>
                <span style={styles.cardLabel}>{config.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {role === 'ambassador' && (
        <section style={styles.section}>
          <h2 style={styles.subheading}>Focus Area</h2>
          {ambassadorProfile?.focus_area ? (
            <p style={styles.focusAreaText}>
              {formatFocusArea(ambassadorProfile.focus_area)}
            </p>
          ) : (
            <p style={styles.noFocusArea}>No focus area assigned</p>
          )}
        </section>
      )}
    </div>
  );
}

function formatFocusArea(area: string): string {
  return area
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
  },
  section: {
    marginBottom: '2rem',
  },
  subheading: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80px',
    padding: '1rem',
    borderRadius: '8px',
    border: '2px solid #d54407',
    textDecoration: 'none',
    color: '#d54407',
    fontWeight: 600,
    fontSize: '1rem',
    textAlign: 'center',
    transition: 'background-color 0.15s, color 0.15s',
  },
  cardLabel: {
    pointerEvents: 'none',
  },
  focusAreaText: {
    fontSize: '1rem',
    color: '#333',
    margin: 0,
  },
  noFocusArea: {
    fontSize: '1rem',
    color: '#666',
    fontStyle: 'italic',
    margin: 0,
  },
};
