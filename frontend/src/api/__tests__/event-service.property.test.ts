import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ApiError } from '../types';

/**
 * Property-Based Tests for Event Service
 * Feature: frontend-backend-integration, Property 12: Event DateTime Validation
 * Validates: Requirements 13.5
 */

// Mock the client module
vi.mock('../client', () => ({
  apiClient: vi.fn(),
}));

// Mock the token-store module
vi.mock('../token-store', () => ({
  getToken: vi.fn(() => 'mock-token'),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

import { createEvent } from '../event-service';

describe('Event Service Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 12: Event DateTime Validation
   *
   * For any pair of datetime values where `ends_at` is less than or equal to `starts_at`,
   * the Event Service SHALL reject the creation request and return an ApiError indicating
   * the end time must be after the start time.
   *
   * **Validates: Requirements 13.5**
   */
  describe('Property 12: Event DateTime Validation', () => {
    /** Generates a base date timestamp within a reasonable range */
    const dateTimestampArb = fc.integer({
      min: new Date('2020-01-01').getTime(),
      max: new Date('2030-12-31').getTime(),
    });

    /** Generates a positive offset (1ms to 1 year) to subtract from starts_at to get ends_at < starts_at */
    const positiveOffsetArb = fc.integer({
      min: 1,
      max: 365 * 24 * 60 * 60 * 1000, // up to 1 year in ms
    });

    /** Generates valid CreateEventData fields (non-datetime) */
    const eventBaseDataArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 100 }),
      creator: fc.integer({ min: 1, max: 10000 }),
    });

    it('rejects with ApiError when ends_at < starts_at', async () => {
      await fc.assert(
        fc.asyncProperty(
          dateTimestampArb,
          positiveOffsetArb,
          eventBaseDataArb,
          async (startsAtMs, offset, baseData) => {
            vi.clearAllMocks();

            const startsAt = new Date(startsAtMs).toISOString();
            const endsAt = new Date(startsAtMs - offset).toISOString();

            try {
              await createEvent({
                title: baseData.title,
                starts_at: startsAt,
                ends_at: endsAt,
                creator: baseData.creator,
              });
              expect.fail('Expected createEvent to throw when ends_at < starts_at');
            } catch (thrownError) {
              const apiError = thrownError as ApiError;
              expect(apiError.status).toBe(400);
              expect(apiError.name).toBe('ValidationError');
              expect(apiError.message).toBe('End time must be after start time');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects with ApiError when ends_at === starts_at', async () => {
      await fc.assert(
        fc.asyncProperty(
          dateTimestampArb,
          eventBaseDataArb,
          async (timestampMs, baseData) => {
            vi.clearAllMocks();

            const sameTime = new Date(timestampMs).toISOString();

            try {
              await createEvent({
                title: baseData.title,
                starts_at: sameTime,
                ends_at: sameTime,
                creator: baseData.creator,
              });
              expect.fail('Expected createEvent to throw when ends_at === starts_at');
            } catch (thrownError) {
              const apiError = thrownError as ApiError;
              expect(apiError.status).toBe(400);
              expect(apiError.name).toBe('ValidationError');
              expect(apiError.message).toBe('End time must be after start time');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
