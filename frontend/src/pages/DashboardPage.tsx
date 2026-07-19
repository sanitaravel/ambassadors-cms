import { useCallback } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/auth-context';
import { useApiQuery } from '../hooks/use-api-query';
import { getPermittedContentTypes, type ContentType } from '../utils/permissions';
import { activityClubService, eventService, newsArticleService } from '../api/services';
import type { AmbassadorProfile } from '../api/content-types';
import type { CollectionResponse } from '../api/types';

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; addPath: string; listPath: string; listLabel: string }> = {
  'activity-clubs': { label: 'Add Activity Club', addPath: '/activity-clubs/new', listPath: '/activity-clubs', listLabel: 'Activity Clubs' },
  'events': { label: 'Add Event', addPath: '/events/new', listPath: '/events', listLabel: 'Events' },
  'news-articles': { label: 'Add News Article', addPath: '/news-articles/new', listPath: '/news-articles', listLabel: 'News Articles' },
};

export function DashboardPage() {
  const { user, role, profile } = useAuth();

  const permittedTypes = getPermittedContentTypes(role);
  const ambassadorProfile = role === 'ambassador' ? (profile as AmbassadorProfile | null) : null;

  // Fetch recent items and counts
  const { data: clubsData } = useApiQuery(
    useCallback(() => activityClubService.getMany({
      sort: 'createdAt:desc',
      pagination: { page: 1, pageSize: 5 },
      populate: { users_permissions_user: { fields: ['username'] } },
    }), [])
  );

  const { data: eventsData } = useApiQuery(
    useCallback(() => eventService.getMany({
      sort: 'starts_at:desc',
      pagination: { page: 1, pageSize: 5 },
      populate: { location: { fields: ['name'] } },
    }), [])
  );

  const { data: articlesData } = useApiQuery(
    useCallback(() => newsArticleService.getMany({
      sort: 'createdAt:desc',
      pagination: { page: 1, pageSize: 5 },
    }), [])
  );

  const clubsTotal = clubsData?.meta?.pagination?.total ?? 0;
  const eventsTotal = eventsData?.meta?.pagination?.total ?? 0;
  const articlesTotal = articlesData?.meta?.pagination?.total ?? 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome, {user?.username ?? 'User'}</h1>

      {/* Stats Overview */}
      <section style={styles.section}>
        <div style={styles.statsGrid}>
          {permittedTypes.includes('activity-clubs') && (
            <Link to="/activity-clubs" style={styles.statCard}>
              <span style={styles.statNumber}>{clubsTotal}</span>
              <span style={styles.statLabel}>Activity Clubs</span>
            </Link>
          )}
          {permittedTypes.includes('events') && (
            <Link to="/events" style={styles.statCard}>
              <span style={styles.statNumber}>{eventsTotal}</span>
              <span style={styles.statLabel}>Events</span>
            </Link>
          )}
          <Link to="/news-articles" style={styles.statCard}>
            <span style={styles.statNumber}>{articlesTotal}</span>
            <span style={styles.statLabel}>News Articles</span>
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section style={styles.section}>
        <h2 style={styles.subheading}>Quick Actions</h2>
        <div style={styles.actionsRow}>
          {permittedTypes.map((type) => {
            const config = CONTENT_TYPE_CONFIG[type];
            return (
              <Link key={type} to={config.addPath} style={styles.actionButton}>
                + {config.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Activity Clubs */}
      {permittedTypes.includes('activity-clubs') && (clubsData?.data ?? []).length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.subheading}>Recent Activity Clubs</h2>
            <Link to="/activity-clubs" style={styles.viewAllLink}>View all →</Link>
          </div>
          <div style={styles.itemsList}>
            {(clubsData?.data ?? []).map((club) => (
              <Link key={club.documentId} to={`/activity-clubs/${club.documentId}`} style={styles.itemCard}>
                <span style={styles.itemTitle}>{club.name}</span>
                <span style={styles.itemMeta}>
                  {(club.users_permissions_user as any)?.username && `by ${(club.users_permissions_user as any).username}`}
                  {club.createdAt && ` · ${formatDate(club.createdAt)}`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Events */}
      {permittedTypes.includes('events') && (eventsData?.data ?? []).length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.subheading}>Recent Events</h2>
            <Link to="/events" style={styles.viewAllLink}>View all →</Link>
          </div>
          <div style={styles.itemsList}>
            {(eventsData?.data ?? []).map((event) => (
              <Link key={event.documentId} to={`/events/${event.documentId}`} style={styles.itemCard}>
                <div style={styles.itemCardTop}>
                  <span style={styles.itemTitle}>{event.title}</span>
                  <span style={{ ...styles.statusBadge, ...getEventStatusStyle(event.event_status) }}>
                    {event.event_status}
                  </span>
                </div>
                <span style={styles.itemMeta}>
                  {event.starts_at && formatDateTime(event.starts_at)}
                  {(event.location as any)?.name && ` · ${(event.location as any).name}`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent News Articles */}
      {(articlesData?.data ?? []).length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.subheading}>Recent News Articles</h2>
            <Link to="/news-articles" style={styles.viewAllLink}>View all →</Link>
          </div>
          <div style={styles.itemsList}>
            {(articlesData?.data ?? []).map((article) => (
              <Link key={article.documentId} to={`/news-articles/${article.documentId}`} style={styles.itemCard}>
                <span style={styles.itemTitle}>{article.title}</span>
                <span style={styles.itemMeta}>
                  {article.summary
                    ? (article.summary as string).length > 80
                      ? (article.summary as string).slice(0, 80) + '…'
                      : article.summary
                    : ''}
                  {article.createdAt && ` · ${formatDate(article.createdAt)}`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ambassador Focus Area */}
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

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatFocusArea(area: string): string {
  return area
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getEventStatusStyle(status: string): React.CSSProperties {
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
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
    marginTop: 0,
  },
  section: {
    marginBottom: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  subheading: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: 0,
    color: '#374151',
  },
  viewAllLink: {
    color: '#d54407',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'border-color 0.15s',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#d54407',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '6px',
    fontWeight: 500,
  },

  // Quick Actions
  actionsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    justifyContent: 'center',
    marginTop: '16px',
  },
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '10px 18px',
    borderRadius: '6px',
    border: '2px solid #d54407',
    textDecoration: 'none',
    color: '#d54407',
    fontWeight: 600,
    fontSize: '0.875rem',
  },

  // Item lists
  itemsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  itemCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: 'inherit',
    backgroundColor: '#fff',
  },
  itemCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  itemTitle: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#111827',
  },
  itemMeta: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    flexShrink: 0,
  },

  // Focus area
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
