import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useApiQuery } from '../../hooks/use-api-query';
import { useApiMutation } from '../../hooks/use-api-mutation';
import { buildingService } from '../../api/building-service';
import { campusService } from '../../api/campus-service';
import { validateBuildingForm } from '../../utils/validation';
import { FormField } from '../../components/forms/FormField';
import { FormActions } from '../../components/forms/FormActions';
import type { BuildingFormData } from '../../types/forms';
import type { ApiError } from '../../api/types';

export function EditBuildingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: entity, isLoading: isFetching, error: fetchError } = useApiQuery(
    () => buildingService.getOne(id!, { populate: 'campus' })
  );

  const { data: campusData } = useApiQuery(() => campusService.getMany());

  const campusOptions = (campusData?.data ?? []).map((c) => ({
    value: c.documentId,
    label: c.name,
  }));

  const [formData, setFormData] = useState<BuildingFormData>({
    name: '',
    code: '',
    address: '',
    campus: '',
  });
  const [formInitialized, setFormInitialized] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    if (entity && !formInitialized) {
      setFormData({
        name: entity.name || '',
        code: entity.code || '',
        address: entity.address || '',
        campus: entity.campus?.documentId || '',
      });
      setFormInitialized(true);
    }
  }, [entity, formInitialized]);

  const { isLoading: isUpdating, mutate } = useApiMutation((data: BuildingFormData) =>
    buildingService.update(id!, {
      name: data.name,
      code: data.code,
      address: data.address,
      ...(data.campus ? { campus: data.campus as unknown as undefined } : {}),
    })
  );

  function handleFieldChange(field: keyof BuildingFormData) {
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

    const validation = validateBuildingForm({
      name: formData.name,
      code: formData.code,
      address: formData.address,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      await mutate(formData);
      navigate('/buildings');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      if (apiError.message?.toLowerCase().includes('unique')) {
        setBackendError('A building with that address already exists');
      } else {
        setBackendError(apiError.message || 'An unexpected error occurred');
      }
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
        <p style={styles.notFoundText}>Building not found.</p>
        <Link to="/buildings" style={styles.link}>Back to Buildings</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Edit Building</h1>

      {backendError && (
        <div role="alert" style={styles.errorBanner}>
          {backendError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Building Name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={fieldErrors.name}
          placeholder="Enter building name"
        />

        <FormField
          label="Code"
          name="code"
          type="text"
          required
          value={formData.code}
          onChange={handleFieldChange('code')}
          error={fieldErrors.code}
          placeholder="Enter building code"
        />

        <FormField
          label="Address"
          name="address"
          type="text"
          required
          value={formData.address}
          onChange={handleFieldChange('address')}
          error={fieldErrors.address}
          placeholder="Enter building address"
        />

        <FormField
          label="Campus"
          name="campus"
          type="select"
          value={formData.campus}
          onChange={handleFieldChange('campus')}
          error={fieldErrors.campus}
          options={campusOptions}
          placeholder="Select a campus (optional)"
        />

        <FormActions
          isLoading={isUpdating}
          submitLabel="Save Changes"
          onCancel={() => navigate('/buildings')}
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
