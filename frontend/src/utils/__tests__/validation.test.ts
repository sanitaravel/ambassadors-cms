import { describe, it, expect } from 'vitest';
import {
  validateClubForm,
  validateBuildingForm,
  validateEventForm,
  validateNewsArticleForm,
} from '../validation';

describe('validateClubForm', () => {
  it('returns valid for non-empty name', () => {
    const result = validateClubForm({ name: 'Chess Club' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects empty name', () => {
    const result = validateClubForm({ name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('Club name is required');
  });

  it('rejects whitespace-only name', () => {
    const result = validateClubForm({ name: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('Club name is required');
  });
});

describe('validateBuildingForm', () => {
  it('returns valid when all required fields are provided', () => {
    const result = validateBuildingForm({
      name: 'Main Hall',
      code: 'MH-01',
      address: '123 Campus Rd',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects empty name', () => {
    const result = validateBuildingForm({ name: '', code: 'A', address: 'B' });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('Building name is required');
  });

  it('rejects empty code', () => {
    const result = validateBuildingForm({ name: 'A', code: '', address: 'B' });
    expect(result.valid).toBe(false);
    expect(result.errors.code).toBe('Building code is required');
  });

  it('rejects empty address', () => {
    const result = validateBuildingForm({ name: 'A', code: 'B', address: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.address).toBe('Building address is required');
  });

  it('reports all errors when all fields are whitespace', () => {
    const result = validateBuildingForm({ name: ' ', code: '\t', address: '\n' });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(3);
  });
});

describe('validateEventForm', () => {
  it('returns valid for complete event data', () => {
    const result = validateEventForm({
      title: 'Tech Talk',
      starts_at: '2025-01-15T10:00:00Z',
      ends_at: '2025-01-15T12:00:00Z',
      event_status: 'planned',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects empty title', () => {
    const result = validateEventForm({
      title: '',
      starts_at: '2025-01-15T10:00:00Z',
      ends_at: '2025-01-15T12:00:00Z',
      event_status: 'planned',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBe('Event title is required');
  });

  it('rejects empty starts_at', () => {
    const result = validateEventForm({
      title: 'Event',
      starts_at: '',
      ends_at: '2025-01-15T12:00:00Z',
      event_status: 'planned',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.starts_at).toBe('Start time is required');
  });

  it('rejects empty ends_at', () => {
    const result = validateEventForm({
      title: 'Event',
      starts_at: '2025-01-15T10:00:00Z',
      ends_at: '',
      event_status: 'planned',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.ends_at).toBe('End time is required');
  });

  it('rejects empty event_status', () => {
    const result = validateEventForm({
      title: 'Event',
      starts_at: '2025-01-15T10:00:00Z',
      ends_at: '2025-01-15T12:00:00Z',
      event_status: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.event_status).toBe('Event status is required');
  });

  it('rejects ends_at equal to starts_at', () => {
    const result = validateEventForm({
      title: 'Event',
      starts_at: '2025-01-15T10:00:00Z',
      ends_at: '2025-01-15T10:00:00Z',
      event_status: 'planned',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.ends_at).toBe('End time must be after start time');
  });

  it('rejects ends_at before starts_at', () => {
    const result = validateEventForm({
      title: 'Event',
      starts_at: '2025-01-15T12:00:00Z',
      ends_at: '2025-01-15T10:00:00Z',
      event_status: 'planned',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.ends_at).toBe('End time must be after start time');
  });
});

describe('validateNewsArticleForm', () => {
  it('returns valid for non-empty title and body', () => {
    const result = validateNewsArticleForm({
      title: 'Breaking News',
      body: 'Content here',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects empty title', () => {
    const result = validateNewsArticleForm({ title: '', body: 'Content' });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBe('Title is required');
  });

  it('rejects empty body', () => {
    const result = validateNewsArticleForm({ title: 'Title', body: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.body).toBe('Body is required');
  });

  it('rejects whitespace-only title and body', () => {
    const result = validateNewsArticleForm({ title: '  ', body: '\t\n' });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBe('Title is required');
    expect(result.errors.body).toBe('Body is required');
  });
});
