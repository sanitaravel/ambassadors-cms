# Implementation Plan: Frontend-Backend Integration

## Overview

This plan implements the integration layer between the React 19 frontend and the Strapi 5 REST API backend for the University Ambassadors CMS. The implementation follows a bottom-up approach: infrastructure (API client, token store), then services (auth, content, club, event), then UI hooks and context, and finally wiring everything together. All code is TypeScript in the `frontend/src/` directory.

## Tasks

- [x] 1. Set up testing infrastructure and install dependencies
  - [x] 1.1 Install required dependencies and configure Vitest
    - Add `qs`, `@types/qs` to dependencies
    - Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `msw`, `jsdom` to devDependencies
    - Add `"test": "vitest --run"` script to `package.json`
    - Create `vitest.config.ts` with jsdom environment and setup file
    - Create `src/test/setup.ts` importing `@testing-library/jest-dom`
    - _Requirements: Design Testing Strategy_

- [x] 2. Implement Infrastructure Layer
  - [x] 2.1 Create TypeScript types and interfaces for API layer
    - Create `src/api/types.ts` with `ApiError`, `ValidationError`, `StrapiEntity<T>`, `StrapiResponse<T>`, `StrapiSingleResponse<T>`, `PaginationMeta`, `CollectionResponse<T>` types
    - Create `src/api/content-types.ts` with all content type interfaces: `Campus`, `Building`, `Location`, `Event`, `EventAttendee`, `ActivityClub`, `ClubMembership`, `AmbassadorProfile`, `StudentProfile`, `ProfessorProfile`, `NewsArticle`, `Issue`
    - Create `src/api/enums.ts` with string union types: `EventStatus`, `LocationType`, `Priority`, `FocusArea`, `MemberRole`, `Department`, `ProfessorTitle`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.2 Implement Token Store module
    - Create `src/api/token-store.ts` with `getToken()`, `setToken(token)`, `removeToken()` functions
    - Use localStorage with key `strapi_jwt`
    - _Requirements: 1.4, 1.5, 4.1_

  - [x] 2.3 Implement API Client
    - Create `src/api/client.ts` with `apiClient<T>(options: ApiRequestOptions): Promise<T>`
    - Read base URL from `import.meta.env.VITE_STRAPI_URL` defaulting to `http://localhost:1337`
    - Prepend `${baseUrl}/api` to all request paths
    - Attach `Authorization: Bearer <token>` header when token exists
    - Set `Content-Type: application/json` when body is present
    - Enforce 30s timeout via `AbortController`
    - Parse error responses into `ApiError` structure (handle JSON and non-JSON bodies)
    - On 401 (non-auth endpoints), clear token and dispatch `auth:expired` custom event
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 2.4 Write property tests for API Client (Properties 1, 2, 10)
    - **Property 1: URL Construction** — For any valid path, URL is `${baseUrl}/api${path}`
    - **Property 2: Request Header Injection** — Token presence → Bearer header; body presence → Content-Type header
    - **Property 10: Error Response Parsing** — 4xx/5xx with JSON error body → structured ApiError
    - Create `src/api/__tests__/client.property.test.ts` using fast-check
    - **Validates: Requirements 1.2, 1.3, 1.4, 6.1, 7.1, 7.2, 7.3**

- [x] 3. Implement Auth Service
  - [x] 3.1 Implement Auth Service module
    - Create `src/api/auth-service.ts` with `login()`, `register()`, `getMe()`, `logout()` functions
    - `login` POSTs to `/auth/local` with `identifier` and `password`
    - `register` POSTs to `/auth/local/register` with `username`, `email`, `password`
    - Both store JWT in Token Store on success and validate response structure
    - `getMe` GETs `/users/me` with optional populate param
    - `logout` removes token from Token Store
    - Handle malformed responses (missing jwt/user) as ApiError
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.6, 4.7_

  - [x] 3.2 Write property tests for Auth Service (Properties 3, 4, 5)
    - **Property 3: Token Storage on Authentication Success** — Successful auth response → token stored in Token Store
    - **Property 4: User Extraction from Authentication Response** — Valid response → user fields preserved without mutation
    - **Property 5: Malformed Authentication Response Detection** — Missing jwt or user → ApiError returned
    - Create `src/api/__tests__/auth-service.property.test.ts` using fast-check
    - **Validates: Requirements 2.2, 2.3, 2.6, 3.2, 3.3**

- [x] 4. Implement Content Service
  - [x] 4.1 Implement Content Service Factory
    - Create `src/api/content-service.ts` with `createContentService<T>(pluralName: string)` factory
    - Implement `getMany`, `getOne`, `create`, `update`, `delete` methods
    - Use `qs` library with `encodeValuesOnly` for query parameter serialization
    - Wrap mutation request bodies in `{ data: ... }` envelope
    - Unwrap Strapi response envelopes (extract `data` and `meta.pagination`)
    - Propagate ApiErrors without modification
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 4.2 Write property tests for Content Service (Properties 6, 7, 8, 9)
    - **Property 6: Strapi Response Envelope Unwrapping** — Valid envelopes → data and pagination preserved
    - **Property 7: Query Parameter Serialization** — Options → correct qs-serialized query string
    - **Property 8: Mutation Request Body Wrapping** — Entity data → wrapped in `{ data: ... }`
    - **Property 9: Error Pass-Through** — ApiErrors propagated without modification
    - Create `src/api/__tests__/content-service.property.test.ts` using fast-check
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6, 6.8**

- [ ] 5. Checkpoint - Ensure infrastructure and services compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Club and Event Services
  - [x] 6.1 Implement Club Service
    - Create `src/api/club-service.ts` with `createClub`, `getPendingClubs`, `approveClub`, `denyClub`
    - `createClub` sends POST with name, description, and user relation
    - `getPendingClubs` fetches clubs with `publicationState=preview`, populates creator
    - `approveClub` publishes the draft club via Strapi publish action
    - `denyClub` deletes the draft club
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 12.3_

  - [x] 6.2 Implement Event Service
    - Create `src/api/event-service.ts` with `createEvent`, `getPendingEvents`, `approveEvent`, `denyEvent`
    - `createEvent` validates `ends_at > starts_at` before sending request
    - Sets `event_status` to "Pending Approval" on creation
    - `getPendingEvents` filters by `event_status=Pending Approval`, populates creator/location/clubs
    - `approveEvent` updates status to "Scheduled"
    - `denyEvent` updates status to "Denied"
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 14.1, 14.2, 14.3_

  - [x] 6.3 Write property test for Event Service (Property 12)
    - **Property 12: Event DateTime Validation** — ends_at ≤ starts_at → ApiError returned
    - Create `src/api/__tests__/event-service.property.test.ts` using fast-check
    - **Validates: Requirements 13.5**

- [x] 7. Implement UI Layer - Hooks
  - [x] 7.1 Implement useApiQuery hook
    - Create `src/hooks/use-api-query.ts`
    - Accept fetcher function, return `{ data, isLoading, error, isSuccess, refetch }`
    - Initialize with loading state, invoke fetcher on mount
    - Handle success (set data, isSuccess) and failure (set error, preserve previous data)
    - Prevent state updates after unmount using cleanup flag
    - `refetch` resets loading/error and re-invokes fetcher
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.8_

  - [x] 7.2 Implement useApiMutation hook
    - Create `src/hooks/use-api-mutation.ts`
    - Accept mutation function, return `{ mutate, reset, data, isLoading, error, isSuccess }`
    - `mutate` sets loading, invokes mutation function, updates state on resolve/reject
    - `reset` restores initial state
    - Prevent state updates after unmount
    - _Requirements: 8.6, 8.7, 8.8_

  - [x] 7.3 Write unit tests for useApiQuery and useApiMutation
    - Create `src/hooks/__tests__/use-api-query.test.ts`
    - Create `src/hooks/__tests__/use-api-mutation.test.ts`
    - Test lifecycle: mount → loading → success/error
    - Test refetch behavior and unmount cleanup
    - Test reset on mutation hook
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ] 8. Implement Auth Context
  - [ ] 8.1 Implement AuthProvider and useAuth hook
    - Create `src/context/auth-context.tsx`
    - Implement `AuthProvider` wrapping children with context
    - Expose `user`, `role`, `profile`, `isAuthenticated`, `isLoading`, `error`, `login`, `register`, `logout`
    - On mount: check Token Store, if token exists fetch `/api/users/me` with profile populations
    - Determine role from profile relations (ambassador > student > professor > null)
    - Listen for `auth:expired` event to handle global 401 logout
    - `login`/`register`: call auth service, then fetch profile, update state
    - Profile fetch retry: retry once on network/non-401 error, fall back to role=null
    - `useAuth()` throws if called outside AuthProvider
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 8.2 Write property test for role determination (Property 11)
    - **Property 11: Role Determination from Profile Relations** — ambassador_profile non-null → "ambassador"; else student_profile non-null → "student"; else professor_profile non-null → "professor"; else null
    - Create `src/context/__tests__/role-determination.property.test.ts` using fast-check
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5**

  - [ ]* 8.3 Write unit tests for AuthProvider
    - Create `src/context/__tests__/auth-context.test.tsx`
    - Test session restoration (token present → valid, token present → expired, no token)
    - Test login/logout state transitions
    - Test `useAuth()` throws outside provider
    - Test `auth:expired` event handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 9. Checkpoint - Ensure all layers compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Wire components together and integrate into app
  - [ ] 10.1 Create environment configuration
    - Create `frontend/.env.example` with `VITE_STRAPI_URL=http://localhost:1337`
    - Create `frontend/.env` (gitignored) with local Strapi URL
    - Add `src/vite-env.d.ts` type augmentation for `ImportMetaEnv` with `VITE_STRAPI_URL`
    - _Requirements: 1.1_

  - [ ] 10.2 Wire AuthProvider into the application root
    - Update `src/main.tsx` to wrap `<App />` with `<AuthProvider>`
    - Ensure the provider is at the top level so all components can access auth state
    - _Requirements: 9.1, 9.5_

  - [ ] 10.3 Create pre-configured content service instances
    - Create `src/api/services.ts` exporting typed service instances for all content types:
      `campusService`, `buildingService`, `locationService`, `eventService`, `eventAttendeeService`, `activityClubService`, `clubMembershipService`, `ambassadorProfileService`, `studentProfileService`, `professorProfileService`, `newsArticleService`, `issueService`
    - Export club service and event service instances
    - _Requirements: 6.1, 11.1, 12.1, 13.1, 14.1_

  - [ ]* 10.4 Write integration tests for key flows
    - Create `src/__tests__/integration/auth-flow.test.ts` using MSW
    - Test full login → profile fetch → role assignment flow
    - Test club creation → pending state
    - Test event creation with datetime validation rejection
    - Test ambassador approval flow
    - Test 401 global interceptor clears session
    - _Requirements: 2.2, 2.3, 4.2, 10.1, 10.2, 11.1, 11.2, 12.2, 13.5, 14.2_

- [ ] 11. Final checkpoint - Ensure everything compiles and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `qs` library is used for Strapi 5 query parameter serialization
- MSW (Mock Service Worker) is used for integration test API mocking
- All code targets TypeScript with React 19 in the existing Vite project

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["2.4", "3.1"] },
    { "id": 4, "tasks": ["3.2", "4.1"] },
    { "id": 5, "tasks": ["4.2", "6.1", "6.2"] },
    { "id": 6, "tasks": ["6.3", "7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3"] },
    { "id": 9, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 10, "tasks": ["10.4"] }
  ]
}
```
