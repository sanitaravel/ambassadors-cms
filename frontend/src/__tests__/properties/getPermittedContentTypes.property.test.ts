import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getPermittedContentTypes } from '../../utils/permissions';
import type { UserRole } from '../../context/auth-context';
import type { ContentType } from '../../utils/permissions';

/**
 * Feature: ambassador-ui, Property 2: Role-Based Dashboard Card Visibility
 * Validates: Requirements 4.2, 4.3
 *
 * student/ambassador → all 4 content types;
 * professor/null → only buildings + news-articles
 */
describe('Feature: ambassador-ui, Property 2: Role-Based Dashboard Card Visibility', () => {
  const ALL_CONTENT_TYPES: ContentType[] = [
    'activity-clubs',
    'buildings',
    'events',
    'news-articles',
  ];

  const LIMITED_CONTENT_TYPES: ContentType[] = ['buildings', 'news-articles'];

  const fullAccessRoleArb: fc.Arbitrary<UserRole> = fc.constantFrom(
    'student' as const,
    'ambassador' as const,
  );

  const limitedAccessRoleArb: fc.Arbitrary<UserRole> = fc.constantFrom(
    'professor' as const,
    null,
  );

  const anyRoleArb: fc.Arbitrary<UserRole> = fc.constantFrom(
    'student' as const,
    'ambassador' as const,
    'professor' as const,
    null,
  );

  it('student or ambassador roles return all 4 content types', () => {
    fc.assert(
      fc.property(fullAccessRoleArb, (role) => {
        const result = getPermittedContentTypes(role);
        expect(result).toEqual(ALL_CONTENT_TYPES);
        expect(result).toHaveLength(4);
      }),
      { numRuns: 100 },
    );
  });

  it('professor or null roles return only buildings and news-articles', () => {
    fc.assert(
      fc.property(limitedAccessRoleArb, (role) => {
        const result = getPermittedContentTypes(role);
        expect(result).toEqual(LIMITED_CONTENT_TYPES);
        expect(result).toHaveLength(2);
      }),
      { numRuns: 100 },
    );
  });

  it('result always contains buildings and news-articles regardless of role', () => {
    fc.assert(
      fc.property(anyRoleArb, (role) => {
        const result = getPermittedContentTypes(role);
        expect(result).toContain('buildings');
        expect(result).toContain('news-articles');
      }),
      { numRuns: 100 },
    );
  });

  it('returned array is always a subset of all known content types', () => {
    fc.assert(
      fc.property(anyRoleArb, (role) => {
        const result = getPermittedContentTypes(role);
        for (const contentType of result) {
          expect(ALL_CONTENT_TYPES).toContain(contentType);
        }
      }),
      { numRuns: 100 },
    );
  });
});
