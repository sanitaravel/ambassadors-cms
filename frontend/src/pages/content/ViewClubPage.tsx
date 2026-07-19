import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { useApiQuery } from '../../hooks/use-api-query';
import { activityClubService, eventService } from '../../api/services';
import { getClubMembers, getUsers, addClubMember, removeClubMember } from '../../api/club-service';
import { BlocksRenderer } from '../../components/content/BlocksRenderer';
import type { ApiError, StrapiEntity } from '../../api/types';
import type { StrapiBlock } from '../../components/forms/strapi-blocks';
import type { ClubMembership } from '../../api/content-types';

export function ViewClubPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: entity, isLoading, error } = useApiQuery(
    () => activityClubService.getOne(id!, { populate: { users_permissions_user: { fields: ['id', 'username'] } } })
  );

  // Members
  const membersFetcher = useCallback(() => getClubMembers(id!), [id]);
  const { data: membersData, isLoading: membersLoading, refetch: refetchMembers } = useApiQuery(membersFetcher);

  // All users (for adding members)
  const { data: allUsers } = useApiQuery(() => getUsers());

  // Club events
  const eventsFetcher = useCallback(
    () => eventService.getMany({
      filters: { activity_clubs: { documentId: { $eq: id } } },
      populate: { location: { fields: ['name'] } },
      sort: 'starts_at:desc',
      pagination: { pageSize: 50 },
    }),
    [id]
  );
  const { data: eventsData, isLoading: eventsLoading } = useApiQuery(eventsFetcher);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin' | 'guest'>('member');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

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
        <p style={styles.notFoundText}>Activity club not found.</p>
        <Link to="/activity-clubs" style={styles.link}>Back to Activity Clubs</Link>
      </div>
    );
  }

  if (!entity) {
    return null;
  }

  const owner = entity.users_permissions_user;
  const isOwner = user && owner && (owner as any).id === user.id;

  const members: StrapiEntity<ClubMembership>[] = membersData?.data ?? [];

  // Filter out users who are already members (or the owner)
  const existingMemberUserIds = new Set(
    members.map((m) => (m.users_permissions_user as any)?.id).filter(Boolean)
  );
  if (owner) existingMemberUserIds.add((owner as any).id);

  const availableUsers = (allUsers ?? []).filter(
    (u: any) => !existingMemberUserIds.has(u.id)
  );

  async function handleAddMember() {
    if (!selectedUserId) return;
    setAddingMember(true);
    setMemberError(null);
    try {
      await addClubMember(id!, selectedUserId, selectedRole);
      setSelectedUserId('');
      refetchMembers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setMemberError(apiError.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(membershipDocId: string) {
    setMemberError(null);
    try {
      await removeClubMember(membershipDocId);
      refetchMembers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setMemberError(apiError.message || 'Failed to remove member');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/activity-clubs" style={styles.backLink}>← Back to Activity Clubs</Link>
        {isOwner && <Link to={`/activity-clubs/${id}/edit`} style={styles.editButton}>Edit</Link>}
      </div>

      <h1 style={styles.title}>{entity.name}</h1>

      <div style={styles.meta}>
        {owner && (
          <span style={styles.metaItem}>Owner: {owner.username}</span>
        )}
        {entity.createdAt && (
          <span style={styles.metaItem}>
            Created {new Date(entity.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Description</h2>
        <BlocksRenderer blocks={entity.description as StrapiBlock[]} />
      </div>

      {/* Events Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Club Events</h2>
          {isOwner && (
            <Link to={`/activity-clubs/${id}/events/new`} style={styles.createEventButton}>
              + Create Event
            </Link>
          )}
        </div>

        {eventsLoading && <p style={styles.muted}>Loading events...</p>}

        {!eventsLoading && (eventsData?.data ?? []).length === 0 && (
          <p style={styles.muted}>No events yet.</p>
        )}

        {(eventsData?.data ?? []).length > 0 && (
          <div style={styles.eventsList}>
            {(eventsData?.data ?? []).map((event) => (
              <Link
                key={event.documentId}
                to={`/events/${event.documentId}`}
                style={styles.eventCard}
              >
                <div style={styles.eventCardHeader}>
                  <span style={styles.eventTitle}>{event.title}</span>
                  <span style={{ ...styles.eventStatusBadge, ...getEventStatusStyle(event.event_status) }}>
                    {event.event_status}
                  </span>
                </div>
                <div style={styles.eventCardMeta}>
                  {event.starts_at && (
                    <span>{formatDateTime(event.starts_at)}</span>
                  )}
                  {event.location && (
                    <span> · {(event.location as any).name}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Members</h2>

        {membersLoading && <p style={styles.muted}>Loading members...</p>}

        {!membersLoading && members.length === 0 && (
          <p style={styles.muted}>No members yet.</p>
        )}

        {members.length > 0 && (
          <table style={styles.memberTable}>
            <thead>
              <tr>
                <th style={styles.memberTh}>User</th>
                <th style={styles.memberTh}>Role</th>
                {isOwner && <th style={styles.memberTh}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((membership) => {
                const memberUser = membership.users_permissions_user as any;
                return (
                  <tr key={membership.documentId} style={styles.memberRow}>
                    <td style={styles.memberTd}>{memberUser?.username ?? '—'}</td>
                    <td style={styles.memberTd}>
                      <span style={styles.roleBadge}>{membership.member_role}</span>
                    </td>
                    {isOwner && (
                      <td style={styles.memberTd}>
                        <button
                          onClick={() => handleRemoveMember(membership.documentId)}
                          style={styles.removeButton}
                          aria-label={`Remove ${memberUser?.username}`}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {memberError && (
          <p style={styles.errorText} role="alert">{memberError}</p>
        )}

        {/* Add Member Form (owner only) */}
        {isOwner && (
          <div style={styles.addMemberForm}>
            <h3 style={styles.addMemberTitle}>Add Member</h3>
            <div style={styles.addMemberRow}>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={styles.select}
                aria-label="Select user to add"
              >
                <option value="">Select a user...</option>
                {availableUsers.map((u: any) => (
                  <option key={u.id} value={u.documentId ?? String(u.id)}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'member' | 'admin' | 'guest')}
                style={styles.selectSmall}
                aria-label="Select member role"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>

              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || addingMember}
                style={{
                  ...styles.addButton,
                  opacity: !selectedUserId || addingMember ? 0.5 : 1,
                  cursor: !selectedUserId || addingMember ? 'not-allowed' : 'pointer',
                }}
              >
                {addingMember ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(isoString: string | undefined): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
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
  meta: { display: 'flex', gap: '16px', marginBottom: '24px', color: '#6b7280', fontSize: '14px' },
  metaItem: {},
  section: { borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '8px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '12px', marginTop: 0 },
  createEventButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    minHeight: '36px',
    padding: '6px 14px',
    backgroundColor: '#d54407',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '13px',
  },
  eventsList: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  eventCard: {
    display: 'block',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background-color 0.1s',
    backgroundColor: '#fff',
  },
  eventCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  eventTitle: { fontWeight: 600, fontSize: '14px', color: '#111827' },
  eventStatusBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 },
  eventCardMeta: { fontSize: '13px', color: '#6b7280' },
  muted: { color: '#9ca3af', fontStyle: 'italic', margin: '8px 0' },
  memberTable: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '16px' },
  memberTh: { textAlign: 'left' as const, padding: '8px 12px', borderBottom: '2px solid #e5e7eb', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: '0.5px' },
  memberRow: { borderBottom: '1px solid #f3f4f6' },
  memberTd: { padding: '8px 12px', verticalAlign: 'middle' as const },
  roleBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#e5e7eb', fontSize: '12px', fontWeight: 500, color: '#374151' },
  removeButton: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '32px',
  },
  addMemberForm: { marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  addMemberTitle: { fontSize: '0.95rem', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' },
  addMemberRow: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const },
  select: { flex: '1 1 200px', minHeight: '40px', padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' },
  selectSmall: { flex: '0 0 110px', minHeight: '40px', padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' },
  addButton: {
    minWidth: '44px',
    minHeight: '40px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#d54407',
    border: 'none',
    borderRadius: '4px',
  },
  errorText: { color: '#dc2626', fontSize: '14px', marginTop: '8px' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' },
  notFoundContainer: { textAlign: 'center' as const, padding: '48px 24px' },
  notFoundText: { fontSize: '18px', color: '#6b7280', marginBottom: '16px' },
  link: { color: '#d54407', textDecoration: 'underline' },
};
