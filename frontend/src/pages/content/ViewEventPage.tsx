import { useParams, Link } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { useApiQuery } from '../../hooks/use-api-query';
import { eventService } from '../../api/services';
import { BlocksRenderer } from '../../components/content/BlocksRenderer';
import type { ApiError } from '../../api/types';
import type { StrapiBlock } from '../../components/forms/strapi-blocks';

export function ViewEventPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: entity, isLoading, error } = useApiQuery(
    () => eventService.getOne(id!, {
      populate: {
        location: { fields: ['name'] },
        creator: { fields: ['id', 'username'] },
      },
    })
  );

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <span>Loading...</span>
      </div>
    );
  }

  if (error && (error as ApiError).status === 404) {
    return (
      <div style={styles.notFoundContainer}>
        <p style={styles.notFoundText}>Event not found.</p>
        <Link to="/events" style={styles.link}>Back to Events</Link>
      </div>
    );
  }

  if (!entity) {
    return null;
  }

  const location = entity.location;
  const creator = entity.creator;
  const isOwner = user && creator && (creator as any).id === user.id;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/events" style={styles.backLink}>← Back to Events</Link>
        {isOwner && <Link to={`/events/${id}/edit`} style={styles.editButton}>Edit</Link>}
      </div>

      <h1 style={styles.title}>{entity.title}</h1>

      <div style={styles.meta}>
        {entity.event_status && (
          <span style={{ ...styles.badge, ...getStatusStyle(entity.event_status) }}>
            {entity.event_status}
          </span>
        )}
      </div>

      <div style={styles.detailsGrid}>
        <DetailItem label="Start" value={formatDateTime(entity.starts_at)} />
        <DetailItem label="End" value={formatDateTime(entity.ends_at)} />
        <DetailItem label="Location" value={location?.name || '—'} />
        <DetailItem label="Created by" value={creator?.username || '—'} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Description</h2>
        <BlocksRenderer blocks={entity.description as StrapiBlock[]} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

function formatDateTime(isoString: string | undefined): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function getStatusStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    'Pending Approval': { backgroundColor: '#fef3c7', color: '#92400e' },
    'Scheduled': { backgroundColor: '#d1fae5', color: '#065f46' },
    'In Progress': { backgroundColor: '#dbeafe', color: '#1e40af' },
    'Finished': { backgroundColor: '#e5e7eb', color: '#374151' },
    'Canceled': { backgroundColor: '#fee2e2', color: '#991b1b' },
    'Denied': { backgroundColor: '#fee2e2', color: '#991b1b' },
    'Archived': { backgroundColor: '#f3f4f6', color: '#6b7280' },
  };
  return map[status] || {};
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '720px', margin: '0 auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  backLink: { color: '#d54407', textDecoration: 'none', fontSize: '14px', fontWeight: 500 },
  editButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    minHeight: '44px',
    padding: '8px 16px',
    backgroundColor: '#d54407',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '14px',
  },
  title: { fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '12px', marginTop: 0 },
  meta: { marginBottom: '20px' },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  detailValue: { fontSize: '14px', color: '#111827' },
  section: { borderTop: '1px solid #e5e7eb', paddingTop: '20px' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '12px', marginTop: 0 },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' },
  notFoundContainer: { textAlign: 'center' as const, padding: '48px 24px' },
  notFoundText: { fontSize: '18px', color: '#6b7280', marginBottom: '16px' },
  link: { color: '#d54407', textDecoration: 'underline' },
};
