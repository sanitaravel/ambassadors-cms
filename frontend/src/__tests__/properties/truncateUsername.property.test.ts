import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { truncateUsername } from '../../utils/format';

/**
 * Feature: ambassador-ui, Property 1: Username Truncation
 * Validates: Requirements 3.2
 *
 * For any string, if the string length exceeds 20 characters,
 * truncateUsername SHALL return a string of exactly 23 characters (20 + "...");
 * otherwise it SHALL return the original string unchanged.
 */
describe('Feature: ambassador-ui, Property 1: Username Truncation', () => {
  const DEFAULT_MAX_LENGTH = 20;

  it('strings > 20 chars produce a (maxLength + 3)-char output ending with "..."', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: DEFAULT_MAX_LENGTH + 1 }),
        (username) => {
          const result = truncateUsername(username);
          expect(result).toHaveLength(DEFAULT_MAX_LENGTH + 3);
          expect(result.endsWith('...')).toBe(true);
          expect(result.slice(0, DEFAULT_MAX_LENGTH)).toBe(username.slice(0, DEFAULT_MAX_LENGTH));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('strings ≤ 20 chars are returned unchanged', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: DEFAULT_MAX_LENGTH }),
        (username) => {
          const result = truncateUsername(username);
          expect(result).toBe(username);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('works with custom maxLength: strings > maxLength produce (maxLength + 3)-char output', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (maxLength, username) => {
          fc.pre(username.length > maxLength);
          const result = truncateUsername(username, maxLength);
          expect(result).toHaveLength(maxLength + 3);
          expect(result.endsWith('...')).toBe(true);
          expect(result.slice(0, maxLength)).toBe(username.slice(0, maxLength));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('works with custom maxLength: strings ≤ maxLength are returned unchanged', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        (maxLength, username) => {
          fc.pre(username.length <= maxLength);
          const result = truncateUsername(username, maxLength);
          expect(result).toBe(username);
        }
      ),
      { numRuns: 100 }
    );
  });
});
