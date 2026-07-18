import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { useApiMutation } from '../../hooks/use-api-mutation';
import { newsArticleService } from '../../api/services';
import { validateNewsArticleForm } from '../../utils/validation';
import { FormField } from '../../components/forms/FormField';
import { FormActions } from '../../components/forms/FormActions';
import type { NewsArticleFormData } from '../../types/forms';
import type { ApiError } from '../../api/types';
import type { NewsArticle } from '../../api/content-types';
import type { StrapiBlock } from '../../components/forms/strapi-blocks';

export function CreateNewsArticlePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<NewsArticleFormData>({
    title: '',
    summary: '',
    body: [],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);

  const { isLoading, mutate } = useApiMutation(
    (data: NewsArticleFormData) =>
      newsArticleService.create({
        title: data.title,
        summary: data.summary || undefined,
        body: data.body,
      } as unknown as Partial<NewsArticle>)
  );

  function handleFieldChange(field: keyof NewsArticleFormData) {
    return (value: string | StrapiBlock[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBackendError(null);

    // For validation, check if body blocks have actual text content
    const bodyText = getBlocksTextContent(formData.body);
    const validation = validateNewsArticleForm({
      title: formData.title,
      body: bodyText,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      await mutate(formData);
      navigate('/news-articles');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setBackendError(apiError.message || 'An unexpected error occurred');
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Add News Article</h1>

      {backendError && (
        <div role="alert" style={styles.errorBanner}>
          {backendError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Title"
          name="title"
          type="text"
          required
          maxLength={255}
          value={formData.title}
          onChange={handleFieldChange('title')}
          error={fieldErrors.title}
          placeholder="Enter article title"
        />

        <FormField
          label="Summary"
          name="summary"
          type="textarea"
          value={formData.summary}
          onChange={handleFieldChange('summary')}
          error={fieldErrors.summary}
          placeholder="Enter article summary (optional)"
        />

        <FormField
          label="Body"
          name="body"
          type="richtext"
          required
          value={formData.body}
          onChange={handleFieldChange('body')}
          error={fieldErrors.body}
          placeholder="Write your article content here..."
        />

        <FormActions
          isLoading={isLoading}
          submitLabel="Create Article"
          onCancel={() => navigate('/news-articles')}
        />
      </form>
    </div>
  );
}

/** Extract plain text from Strapi blocks for validation purposes */
function getBlocksTextContent(blocks: StrapiBlock[]): string {
  if (!blocks || blocks.length === 0) return '';
  return blocks
    .map((block) => {
      if ('children' in block) {
        if (block.type === 'list') {
          return block.children
            .map((item) => item.children.map((c) => c.text).join(''))
            .join('\n');
        }
        return block.children.map((c) => c.text).join('');
      }
      return '';
    })
    .join('\n')
    .trim();
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '24px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '24px',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
  },
};
