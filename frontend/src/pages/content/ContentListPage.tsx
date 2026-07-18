import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApiQuery } from '../../hooks/use-api-query';
import { createContentService } from '../../api/content-service';
import type { CollectionResponse } from '../../api/types';

export interface ContentListPageProps {
  contentType: 'activity-clubs' | 'buildings' | 'events' | 'news-articles';
  displayName: string;
  nameField: string;
}

const PAGE_SIZE = 25;

export function ContentListPage({ contentType, displayName, nameField }: ContentListPageProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const service = createContentService<Record<string, unknown>>(contentType);

  const fetcher = useCallback(
    () => service.getMany({ pagination: { page, pageSize: PAGE_SIZE } }),
    [page, contentType],
  );

  const { data, isLoading, error, refetch } = useApiQuery<CollectionResponse<Record<string, unknown>>>(fetcher);

  // Reset page and refetch when content type changes
  useEffect(() => {
    setPage(1);
    refetch();
  }, [contentType]);

  // Refetch when page changes (but not on contentType change — handled above)
  useEffect(() => {
    refetch();
  }, [page]);

  const pagination = data?.meta?.pagination;
  const entities = data?.data ?? [];
  const pageCount = pagination?.pageCount ?? 0;
  const total = pagination?.total ?? 0;

  function handleEntityClick(documentId: string) {
    navigate(`/${contentType}/${documentId}/edit`);
  }

  function handlePrevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  function handleNextPage() {
    setPage((p) => Math.min(pageCount, p + 1));
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>{displayName}</h1>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} aria-label="Loading" />
          <p style={styles.loadingText}>Loading…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>{displayName}</h1>
        <div style={styles.errorContainer}>
          <p style={styles.errorText} role="alert">
            {error.message || 'Something went wrong. Please try again.'}
          </p>
          <button onClick={refetch} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (entities.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>{displayName}</h1>
        <div style={styles.emptyContainer}>
          <p style={styles.emptyText}>No {displayName.toLowerCase()} found.</p>
          <Link to={`/${contentType}/new`} style={styles.createLink}>
            Create your first one
          </Link>
        </div>
      </div>
    );
  }

  // Data state
  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.heading}>{displayName}</h1>
        <Link to={`/${contentType}/new`} style={styles.addButton}>
          + Add
        </Link>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Created</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity) => (
            <tr
              key={entity.documentId}
              onClick={() => handleEntityClick(entity.documentId)}
              style={styles.tableRow}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleEntityClick(entity.documentId);
                }
              }}
            >
              <td style={styles.td}>
                {String((entity as Record<string, unknown>)[nameField] ?? '')}
              </td>
              <td style={styles.td}>
                {formatDate((entity as Record<string, unknown>).createdAt as string | undefined)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {total > PAGE_SIZE && (
        <div style={styles.pagination}>
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            style={{
              ...styles.pageButton,
              opacity: page <= 1 ? 0.5 : 1,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {page} of {pageCount}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= pageCount}
            style={{
              ...styles.pageButton,
              opacity: page >= pageCount ? 0.5 : 1,
              cursor: page >= pageCount ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(isoString: string | undefined): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'left',
  },
  heading: {
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
    marginTop: 0,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    minHeight: '44px',
    padding: '0.5rem 1rem',
    backgroundColor: '#d54407',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e4e7',
    borderTopColor: '#d54407',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#666',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 0',
    gap: '1rem',
  },
  errorText: {
    color: '#c0392b',
    fontSize: '1rem',
    margin: 0,
  },
  retryButton: {
    minWidth: '44px',
    minHeight: '44px',
    padding: '0.625rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#d54407',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 0',
    gap: '1rem',
  },
  emptyText: {
    fontSize: '1rem',
    color: '#666',
    margin: 0,
  },
  createLink: {
    color: '#d54407',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '1rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    borderBottom: '2px solid #e5e4e7',
    fontWeight: 600,
    color: '#333',
    fontSize: '0.875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tableRow: {
    cursor: 'pointer',
    borderBottom: '1px solid #e5e4e7',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '0.75rem 1rem',
    verticalAlign: 'middle',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    padding: '1rem 0',
  },
  pageButton: {
    minWidth: '44px',
    minHeight: '44px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#d54407',
    backgroundColor: '#fff',
    border: '2px solid #d54407',
    borderRadius: '4px',
  },
  pageInfo: {
    fontSize: '0.875rem',
    color: '#666',
  },
};
