import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApiQuery } from '../../hooks/use-api-query';
import { useApiMutation } from '../../hooks/use-api-mutation';
import { activityClubService } from '../../api/services';
import { validateClubForm } from '../../utils/validation';
import { FormField } from '../../components/forms/FormField';
import { FormActions } from '../../components/forms/FormActions';
import type { ClubFormData } from '../../types/forms';
import type { ApiError } from '../../api/types';
import type { ActivityClub } from '../../api/content-types';
import { Link } from 'react-router';

export function EditClubPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: entity, isLoading: isFetching, error: fetchError } = useApiQuery(
    () => activityClubService.getOne(id!)
  );

  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    description: '',
  });
  const [formInitialized, setFormInitialized] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    if (entity && !formInitialized) {
      setFormData({
        name: entity.name || '',
        description: (entity.description as string) ?? '',
      });
      setFormInitialized(true);
    }
  }, [entity, formInitialized]);

  const { isLoading: isUpdating, mutate } = useApiMutation(
    (data: ClubFormData) =>
      activityClubService.update(id!, {
        name: data.name,
        description: data.description || undefined,
      } as unknown as Partial<ActivityClub>)
  );

  function handleFieldChange(field: keyof ClubFormData) {
    return (value: string) => {
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

    const validation = validateClubForm({ name: formData.name });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      await mutate(formData);
      navigate('/activity-clubs');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setBackendError(apiError.message || 'An unexpected error occurred');
    }
  }

  if (isFetching) {
    return (
      <div style={styles.loadingContainer}>
        <span>Loading...</span>
      </div>
    );
  }

  if (fetchError && (fetchError as ApiError).status === 404) {
    return (
      <div style={styles.notFoundContainer}>
        <p style={styles.notFoundText}>Activity club not found.</p>
        <Link to="/activity-clubs" style={styles.link}>Back to Activity Clubs</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Edit Activity Club</h1>

      {backendError && (
        <div role="alert" style={styles.errorBanner}>
          {backendError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Club Name"
          name="name"
          type="text"
          required
          maxLength={255}
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={fieldErrors.name}
          placeholder="Enter club name"
        />

        <FormField
          label="Description"
          name="description"
          type="richtext"
          value={formData.description}
          onChange={handleFieldChange('description')}
          error={fieldErrors.description}
          placeholder="Enter club description (optional)"
        />

        <FormActions
          isLoading={isUpdating}
          submitLabel="Save Changes"
          onCancel={() => navigate('/activity-clubs')}
        />
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '640px', margin: '0 auto', padding: '24px' },
  heading: { fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' },
  errorBanner: { padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' },
  notFoundContainer: { textAlign: 'center' as const, padding: '48px 24px' },
  notFoundText: { fontSize: '18px', color: '#6b7280', marginBottom: '16px' },
  link: { color: '#d54407', textDecoration: 'underline' },
};
