export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateClubForm(data: { name: string }): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.name.trim().length === 0) {
    errors.name = 'Club name is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateBuildingForm(data: {
  name: string;
  code: string;
  address: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.name.trim().length === 0) {
    errors.name = 'Building name is required';
  }
  if (data.code.trim().length === 0) {
    errors.code = 'Building code is required';
  }
  if (data.address.trim().length === 0) {
    errors.address = 'Building address is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateEventForm(data: {
  title: string;
  starts_at: string;
  ends_at: string;
  event_status: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.title.trim().length === 0) {
    errors.title = 'Event title is required';
  }
  if (data.starts_at.trim().length === 0) {
    errors.starts_at = 'Start time is required';
  }
  if (data.ends_at.trim().length === 0) {
    errors.ends_at = 'End time is required';
  }
  if (data.event_status.trim().length === 0) {
    errors.event_status = 'Event status is required';
  }

  // Only check date ordering if both dates are provided
  if (data.starts_at.trim().length > 0 && data.ends_at.trim().length > 0) {
    const startsAt = new Date(data.starts_at);
    const endsAt = new Date(data.ends_at);
    if (endsAt <= startsAt) {
      errors.ends_at = 'End time must be after start time';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateNewsArticleForm(data: {
  title: string;
  body: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (data.body.trim().length === 0) {
    errors.body = 'Body is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
