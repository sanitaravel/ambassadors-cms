import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { useApiMutation } from '../../hooks/use-api-mutation';
import { useApiQuery } from '../../hooks/use-api-query';
import { eventService, locationService } from '../../api/services';
import { validateEventForm } from '../../utils/validation';
import { FormField } from '../../components/forms/FormField';
import { FormActions } from '../../components/forms/FormActions';
import type { EventFormData } from '../../types/forms';
import type { ApiError } from '../../api/types';
import type { Event } from '../../api/content-types';

const EVENT_STATUS_OPTIONS = [
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Denied', label: 'Denied' },
  { value: 'Canceled', label: 'Canceled' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Finished', label: 'Finished' },
  { value: 'Archived', label: 'Archived' },
];

export function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    event_status: '',
    location: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);

  const { data: locationData } = useApiQuery(() => locationService.getMany());

  const locationOptions = (locationData?.data ?? []).map((loc) => ({
    value: loc.documentId,
    label: loc.name,
  }));

  const { isLoading, mutate } = useApiMutation((data: EventFormData) =>
    eventService.create({
      title: data.title,
      description: data.description || undefined,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      event_status: data.event_status,
      ...(data.location ? { location: data.location } : {}),
    } as unknown as Partial<Event>)
  );

  function handleFieldChange(field: keyof EventFormData) {
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

    const validation = validateEventForm({
      title: formData.title,
      starts_at: formData.starts_at,
      ends_at: formData.ends_at,
      event_status: formData.event_status,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      await mutate(formData);
      navigate('/events');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setBackendError(apiError.message || 'An unexpected error occurred');
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Add Event</h1>

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
          placeholder="Enter event title"
        />

        <FormField
          label="Description"
          name="description"
          type="richtext"
          value={formData.description}
          onChange={handleFieldChange('description')}
          error={fieldErrors.description}
          placeholder="Enter event description (optional)"
        />

        <FormField
          label="Start Time"
          name="starts_at"
          type="datetime"
          required
          value={formData.starts_at}
          onChange={handleFieldChange('starts_at')}
          error={fieldErrors.starts_at}
          placeholder="Select start date and time"
        />

        <FormField
          label="End Time"
          name="ends_at"
          type="datetime"
          required
          value={formData.ends_at}
          onChange={handleFieldChange('ends_at')}
          error={fieldErrors.ends_at}
          placeholder="Select end date and time"
        />

        <FormField
          label="Event Status"
          name="event_status"
          type="select"
          required
          value={formData.event_status}
          onChange={handleFieldChange('event_status')}
          error={fieldErrors.event_status}
          options={EVENT_STATUS_OPTIONS}
          placeholder="Select event status"
        />

        <FormField
          label="Location"
          name="location"
          type="select"
          value={formData.location}
          onChange={handleFieldChange('location')}
          error={fieldErrors.location}
          options={locationOptions}
          placeholder="Select a location (optional)"
        />

        <FormActions
          isLoading={isLoading}
          submitLabel="Create Event"
          onCancel={() => navigate('/events')}
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
