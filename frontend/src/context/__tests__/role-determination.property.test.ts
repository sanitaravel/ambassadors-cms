import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { determineRole } from '../auth-context';
import type { UserProfiles } from '../../api/auth-service';
import type {
  AmbassadorProfile,
  StudentProfile,
  ProfessorProfile,
} from '../../api/content-types';
import type { FocusArea, Department, ProfessorTitle } from '../../api/enums';

/**
 * **Validates: Requirements 10.2, 10.3, 10.4, 10.5**
 *
 * Property 11: Role Determination from Profile Relations
 * ambassador_profile non-null → "ambassador";
 * else student_profile non-null → "student";
 * else professor_profile non-null → "professor";
 * else null
 */

// --- Arbitraries for profile types ---

const focusAreaArb: fc.Arbitrary<FocusArea> = fc.constantFrom(
  'admissions',
  'international_students',
  'student_life',
  'academic_support',
  'campus_tours',
  'events',
  'housing',
  'career_services',
  'research',
  'community_outreach',
  'social_media',
  'other',
);

const departmentArb: fc.Arbitrary<Department> = fc.constantFrom(
  'natural_science',
  'law',
  'finance',
);

const professorTitleArb: fc.Arbitrary<ProfessorTitle> = fc.constantFrom(
  'Prof.',
  'Prof. Dr.',
);

const ambassadorProfileArb: fc.Arbitrary<AmbassadorProfile> = fc.record({
  focus_area: fc.option(focusAreaArb, { nil: undefined }),
}) as fc.Arbitrary<AmbassadorProfile>;

const studentProfileArb: fc.Arbitrary<StudentProfile> = fc.record({
  student_number: fc.integer({ min: 1, max: 999999 }),
  program: fc.string({ minLength: 1, maxLength: 50 }),
  year_of_study: fc.integer({ min: 1, max: 10 }),
  month_of_study: fc.integer({ min: 1, max: 12 }),
});

const professorProfileArb: fc.Arbitrary<ProfessorProfile> = fc.record({
  department: departmentArb,
  title: professorTitleArb,
});

/** Generates a nullable/undefined profile field (absent) */
const absentProfileArb: fc.Arbitrary<null | undefined> = fc.constantFrom(null, undefined);

describe('Property 11: Role Determination from Profile Relations', () => {
  it('ambassador priority: when ambassador_profile is non-null, role is always "ambassador"', () => {
    fc.assert(
      fc.property(
        ambassadorProfileArb,
        fc.option(studentProfileArb, { nil: undefined }),
        fc.option(professorProfileArb, { nil: undefined }),
        (ambassadorProfile, studentProfile, professorProfile) => {
          const profiles: UserProfiles = {
            ambassador_profile: ambassadorProfile,
            student_profile: studentProfile,
            professor_profile: professorProfile,
          };
          expect(determineRole(profiles)).toBe('ambassador');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('student fallback: when ambassador_profile is absent but student_profile is non-null, role is always "student"', () => {
    fc.assert(
      fc.property(
        absentProfileArb,
        studentProfileArb,
        fc.option(professorProfileArb, { nil: undefined }),
        (ambassadorProfile, studentProfile, professorProfile) => {
          const profiles: UserProfiles = {
            ambassador_profile: ambassadorProfile,
            student_profile: studentProfile,
            professor_profile: professorProfile,
          };
          expect(determineRole(profiles)).toBe('student');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('professor fallback: when ambassador and student profiles are absent but professor_profile is non-null, role is always "professor"', () => {
    fc.assert(
      fc.property(
        absentProfileArb,
        absentProfileArb,
        professorProfileArb,
        (ambassadorProfile, studentProfile, professorProfile) => {
          const profiles: UserProfiles = {
            ambassador_profile: ambassadorProfile,
            student_profile: studentProfile,
            professor_profile: professorProfile,
          };
          expect(determineRole(profiles)).toBe('professor');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no role: when all profiles are absent, role is null', () => {
    fc.assert(
      fc.property(
        absentProfileArb,
        absentProfileArb,
        absentProfileArb,
        (ambassadorProfile, studentProfile, professorProfile) => {
          const profiles: UserProfiles = {
            ambassador_profile: ambassadorProfile,
            student_profile: professorProfile,
            professor_profile: ambassadorProfile,
          };
          // All absent values: null or undefined
          const profilesActual: UserProfiles = {
            ambassador_profile: ambassadorProfile,
            student_profile: studentProfile,
            professor_profile: professorProfile,
          };
          expect(determineRole(profilesActual)).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('exhaustive combinations: role follows priority ambassador > student > professor > null', () => {
    // Generate each profile as either present (non-null) or absent (null/undefined)
    const optionalAmbassadorArb = fc.oneof(
      ambassadorProfileArb,
      absentProfileArb,
    );
    const optionalStudentArb = fc.oneof(
      studentProfileArb,
      absentProfileArb,
    );
    const optionalProfessorArb = fc.oneof(
      professorProfileArb,
      absentProfileArb,
    );

    fc.assert(
      fc.property(
        optionalAmbassadorArb,
        optionalStudentArb,
        optionalProfessorArb,
        (ambassadorProfile, studentProfile, professorProfile) => {
          const profiles: UserProfiles = {
            ambassador_profile: ambassadorProfile,
            student_profile: studentProfile,
            professor_profile: professorProfile,
          };

          const role = determineRole(profiles);

          // Verify priority logic
          if (ambassadorProfile != null) {
            expect(role).toBe('ambassador');
          } else if (studentProfile != null) {
            expect(role).toBe('student');
          } else if (professorProfile != null) {
            expect(role).toBe('professor');
          } else {
            expect(role).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
