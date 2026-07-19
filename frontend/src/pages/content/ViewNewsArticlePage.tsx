import { useParams, Link } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { useApiQuery } from '../../hooks/use-api-query';
import { newsArticleService } from '../../api/services';
import { BlocksRenderer } from '../../components/content/BlocksRenderer';
import type { ApiError } from '../../api/types';
import type { StrapiBlock } from '../../components/forms/strapi-blocks';

export function ViewNewsArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: entity, isLoading, error } = useApiQuery(
    () => newsArticleService.getOne(id!, { populate: { users_permissions_users: { fields: ['id', 'username'] } } })
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
        <p style={styles.notFoundText}>News article not found.</p>
        <Link to="/news-articles" style={styles.link}>Back to News Articles</Link>
      </div>
    );
  }

  if (!entity) {
    return null;
  }

  const authors = entity.users_permissions_users ?? [];
  const isAuthor = user && authors.some((a: any) => a.id === user.id);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/news-articles" style={styles.backLink}>← Back to News Articles</Link>
        {isAuthor && <Link to={`/news-articles/${id}/edit`} style={styles.editButton}>Edit</Link>}
      </div>

      <h1 style={styles.title}>{entity.title}</h1>

      <div style={styles.meta}>
        {authors.length > 0 && (
          <span style={styles.metaItem}>
            By {authors.map((a) => a.username).join(', ')}
          </span>
        )}
        {entity.createdAt && (
          <span style={styles.metaItem}>
            {new Date(entity.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        )}
      </div>

      {entity.summary && (
        <p style={styles.summary}>{entity.summary}</p>
      )}

      <div style={styles.body}>
        <BlocksRenderer blocks={entity.body as StrapiBlock[]} />
      </div>
    </div>
  );
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
  meta: { display: 'flex', gap: '16px', marginBottom: '20px', color: '#6b7280', fontSize: '14px' },
  metaItem: {},
  summary: { fontSize: '1.1rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic' },
  body: { borderTop: '1px solid #e5e7eb', paddingTop: '24px' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' },
  notFoundContainer: { textAlign: 'center' as const, padding: '48px 24px' },
  notFoundText: { fontSize: '18px', color: '#6b7280', marginBottom: '16px' },
  link: { color: '#d54407', textDecoration: 'underline' },
};
