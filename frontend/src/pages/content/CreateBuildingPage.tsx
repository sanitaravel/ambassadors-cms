import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApiMutation } from '../../hooks/use-api-mutation';
import { useApiQuery } from '../../hooks/use-api-query';
import { buildingService } from '../../api/building-service';
import { campusService } from '../../api/campus-service';
import { validateBuildingForm } from '../../utils/validation';
import { FormField } from '../../components/forms/FormField';
import { FormActions } from '../../components/forms/FormActions';
import type { BuildingFormData } from '../../types/forms';
import type { ApiError } from '../../api/types';

export function CreateBuildingPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<BuildingFormData>({
    name: '',
    code: '',
    address: '',
    campus: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);

  const { data: campusData } = useApiQuery(() => campusService.getMany());

  const campusOptions = (campusData?.data ?? []).map((c) => ({
    value: c.documentId,
    label: c.name,
  }));

  const { isLoading, mutate } = useApiMutation((data: BuildingFormData) =>
    buildingService.create({
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

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Add Building</h1>

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
          isLoading={isLoading}
          submitLabel="Create Building"
          onCancel={() => navigate('/buildings')}
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
