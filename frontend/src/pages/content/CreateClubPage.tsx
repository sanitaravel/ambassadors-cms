import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { useApiMutation } from '../../hooks/use-api-mutation';
import { createClub } from '../../api/club-service';
import { validateClubForm } from '../../utils/validation';
import { FormField } from '../../components/forms/FormField';
import { FormActions } from '../../components/forms/FormActions';
import type { ClubFormData } from '../../types/forms';
import type { ApiError } from '../../api/types';

export function CreateClubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);

  const { isLoading, mutate } = useApiMutation(
    (data: ClubFormData) =>
      createClub(
        {
          name: data.name,
          description: data.description || undefined,
        },
        user!.id
      )
  );

  function handleFieldChange(field: keyof ClubFormData) {
    return (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
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

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Add Activity Club</h1>

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
          isLoading={isLoading}
          submitLabel="Create Club"
          onCancel={() => navigate('/activity-clubs')}
        />
      </form>
    </div>
  );
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
