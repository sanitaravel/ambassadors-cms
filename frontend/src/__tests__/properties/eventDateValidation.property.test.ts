import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEventForm } from '../../utils/validation';

/**
 * Feature: ambassador-ui, Property 4: Event Date Validation
 * Validates: Requirements 8.3
 *
 * For any pair of datetime strings where `ends_at` is less than or equal to `starts_at`,
 * `validateEventForm` SHALL return `valid: false` with an error containing
 * "End time must be after start time".
 */

/** Generator for a valid ISO datetime string within a reasonable range */
const isoDatetimeArb = fc
  .date({
    min: new Date('2000-01-01T00:00:00Z'),
    max: new Date('2099-12-31T23:59:59Z'),
  })
  .map((d) => d.toISOString());

describe('Feature: ambassador-ui, Property 4: Event Date Validation', () => {
  it('rejects when ends_at equals starts_at', () => {
    fc.assert(
      fc.property(isoDatetimeArb, (datetime) => {
        const result = validateEventForm({
          title: 'Valid Event Title',
          starts_at: datetime,
          ends_at: datetime,
          event_status: 'planned',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty('ends_at', 'End time must be after start time');
      }),
      { numRuns: 100 }
    );
  });

  it('rejects when ends_at is before starts_at', () => {
    fc.assert(
      fc.property(
        isoDatetimeArb,
        fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 }), // 1ms to ~1 year offset
        (startsAtStr, offsetMs) => {
          const startsAt = new Date(startsAtStr);
          const endsAt = new Date(startsAt.getTime() - offsetMs);

          const result = validateEventForm({
            title: 'Valid Event Title',
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            event_status: 'planned',
          });
          expect(result.valid).toBe(false);
          expect(result.errors).toHaveProperty('ends_at', 'End time must be after start time');
        }
      ),
      { numRuns: 100 }
    );
  });
});
