import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateClubForm,
  validateBuildingForm,
  validateEventForm,
  validateNewsArticleForm,
} from '../../utils/validation';

/**
 * Feature: ambassador-ui, Property 3: Required Field Validation Rejects Empty/Whitespace Input
 * Validates: Requirements 6.3, 7.3, 8.4, 9.3
 *
 * For any content type form and for any required field in that form,
 * if the field value is empty or composed entirely of whitespace characters,
 * the corresponding validation function SHALL return `valid: false` with an error message for that field.
 */

/** Generator for whitespace-only strings (empty, spaces, tabs, newlines, etc.) */
const whitespaceArb = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), { minLength: 0, maxLength: 20 })
  .map((chars) => chars.join(''));

describe('Feature: ambassador-ui, Property 3: Required Field Validation Rejects Empty/Whitespace Input', () => {
  describe('validateClubForm — required field: name', () => {
    it('rejects whitespace-only name', () => {
      fc.assert(
        fc.property(whitespaceArb, (name) => {
          const result = validateClubForm({ name });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('name');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('validateBuildingForm — required fields: name, code, address', () => {
    it('rejects whitespace-only name', () => {
      fc.assert(
        fc.property(whitespaceArb, (name) => {
          const result = validateBuildingForm({ name, code: 'VALID', address: '123 Main St' });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('name');
        }),
        { numRuns: 100 }
      );
    });

    it('rejects whitespace-only code', () => {
      fc.assert(
        fc.property(whitespaceArb, (code) => {
          const result = validateBuildingForm({ name: 'Valid Building', code, address: '123 Main St' });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('code');
        }),
        { numRuns: 100 }
      );
    });

    it('rejects whitespace-only address', () => {
      fc.assert(
        fc.property(whitespaceArb, (address) => {
          const result = validateBuildingForm({ name: 'Valid Building', code: 'BLD1', address });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('address');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('validateEventForm — required fields: title, starts_at, ends_at, event_status', () => {
    it('rejects whitespace-only title', () => {
      fc.assert(
        fc.property(whitespaceArb, (title) => {
          const result = validateEventForm({
            title,
            starts_at: '2025-01-01T10:00:00Z',
            ends_at: '2025-01-01T12:00:00Z',
            event_status: 'planned',
          });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('title');
        }),
        { numRuns: 100 }
      );
    });

    it('rejects whitespace-only starts_at', () => {
      fc.assert(
        fc.property(whitespaceArb, (starts_at) => {
          const result = validateEventForm({
            title: 'Valid Event',
            starts_at,
            ends_at: '2025-01-01T12:00:00Z',
            event_status: 'planned',
          });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('starts_at');
        }),
        { numRuns: 100 }
      );
    });

    it('rejects whitespace-only ends_at', () => {
      fc.assert(
        fc.property(whitespaceArb, (ends_at) => {
          const result = validateEventForm({
            title: 'Valid Event',
            starts_at: '2025-01-01T10:00:00Z',
            ends_at,
            event_status: 'planned',
          });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('ends_at');
        }),
        { numRuns: 100 }
      );
    });

    it('rejects whitespace-only event_status', () => {
      fc.assert(
        fc.property(whitespaceArb, (event_status) => {
          const result = validateEventForm({
            title: 'Valid Event',
            starts_at: '2025-01-01T10:00:00Z',
            ends_at: '2025-01-01T12:00:00Z',
            event_status,
          });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('event_status');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('validateNewsArticleForm — required fields: title, body', () => {
    it('rejects whitespace-only title', () => {
      fc.assert(
        fc.property(whitespaceArb, (title) => {
          const result = validateNewsArticleForm({ title, body: 'Valid body content' });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('title');
        }),
        { numRuns: 100 }
      );
    });

    it('rejects whitespace-only body', () => {
      fc.assert(
        fc.property(whitespaceArb, (body) => {
          const result = validateNewsArticleForm({ title: 'Valid Title', body });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('body');
        }),
        { numRuns: 100 }
      );
    });
  });
});
