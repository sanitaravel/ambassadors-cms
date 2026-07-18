# Implementation Plan: Ambassador UI

## Overview

Build the React SPA content management interface for the SRH Ambassador Platform. The implementation leverages the existing API client, content services, auth context, and custom hooks. The primary work involves creating utility functions, routing infrastructure, layout components, form components, and page-level compositions connecting them all together.

## Tasks

- [ ] 1. Create utility functions and type definitions
  - [ ] 1.1 Create form data types and validation utilities
    - Create `src/types/forms.ts` with `ClubFormData`, `BuildingFormData`, `EventFormData`, `NewsArticleFormData` interfaces
    - Create `src/utils/validation.ts` with `ValidationResult` interface and `validateClubForm`, `validateBuildingForm`, `validateEventForm`, `validateNewsArticleForm` pure functions
    - All required fields must reject empty/whitespace-only values; event form must reject `ends_at <= starts_at`
    - _Requirements: 6.3, 7.3, 8.3, 8.4, 9.3, 10.4_

  - [ ] 1.2 Create permission and formatting utilities
    - Create `src/utils/permissions.ts` with `getPermittedContentTypes(role)` returning content type arrays per role
    - Create `src/utils/format.ts` with `truncateUsername(username, maxLength?)` that truncates at 20 chars with "..." suffix
    - Create `src/utils/redirect-store.ts` with `storeRedirectPath`, `getRedirectPath`, `clearRedirectPath` using localStorage
    - _Requirements: 3.2, 4.2, 4.3, 11.1, 11.2_

  - [ ]* 1.3 Write property tests for truncateUsername
    - **Property 1: Username Truncation**
    - Verify: strings > 20 chars produce 23-char output (20 + "..."); strings ≤ 20 chars return unchanged
    - **Validates: Requirements 3.2**

  - [ ]* 1.4 Write property tests for getPermittedContentTypes
    - **Property 2: Role-Based Dashboard Card Visibility**
    - Verify: student/ambassador → all 4 content types; professor/null → only buildings + news-articles
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 1.5 Write property tests for form validation (required fields)
    - **Property 3: Required Field Validation Rejects Empty/Whitespace Input**
    - Generate arbitrary whitespace strings for each required field across all form validators and assert `valid: false`
    - **Validates: Requirements 6.3, 7.3, 8.4, 9.3**

  - [ ]* 1.6 Write property test for event date validation
    - **Property 4: Event Date Validation**
    - Generate datetime pairs where `ends_at <= starts_at` and assert `validateEventForm` returns error with "End time must be after start time"
    - **Validates: Requirements 8.3**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Set up routing and layout infrastructure
  - [ ] 3.1 Install react-router and set up router configuration
    - Install `react-router` (v7) dependency
    - Create `src/router.tsx` with route definitions matching the routing table in the design document
    - Update `src/App.tsx` to render `AuthProvider` wrapping `RouterProvider`
    - Remove default Vite boilerplate content from App.tsx
    - _Requirements: 3.1, 11.4_

  - [ ] 3.2 Create AuthGuard component
    - Create `src/components/auth/AuthGuard.tsx` that checks `useAuth().isAuthenticated`
    - If `isLoading`, render a loading spinner
    - If unauthenticated, store current path via `storeRedirectPath` and redirect to `/login`
    - If authenticated, render children/outlet
    - _Requirements: 11.1, 11.4_

  - [ ] 3.3 Create AppLayout with NavBar
    - Create `src/components/layout/NavBar.tsx` with links to Dashboard, Activity Clubs, Buildings, Events, News Articles
    - Right side: truncated username (using `truncateUsername`) + logout button
    - Create `src/components/layout/AppLayout.tsx` rendering NavBar + `<Outlet />`
    - Use white (#FFFFFF) background; accent color (#d54407) for active nav links
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 12.1, 12.2_

  - [ ] 3.4 Create NotFoundPage
    - Create `src/pages/NotFoundPage.tsx` displaying a 404 message and a link back to Dashboard
    - Register as catch-all route in router config
    - _Requirements: 3.5_

- [ ] 4. Implement login page and auth redirect flow
  - [ ] 4.1 Create LoginPage component
    - Create `src/pages/LoginPage.tsx` with email input (max 254 chars), password input (max 128 chars), and submit button
    - Style submit button with accent color (#d54407)
    - Prevent submission when either field is empty (display required-field validation)
    - On successful login, redirect to stored path (via `getRedirectPath`) or Dashboard; clear stored path
    - On failure, display error below form, retain email, clear password
    - On network error, display "service unreachable" message, retain both fields
    - Disable submit button + show loading indicator while request is in progress
    - If already authenticated, redirect to Dashboard
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 11.2, 11.3_

  - [ ]* 4.2 Write unit tests for LoginPage
    - Test: renders email/password fields and submit button
    - Test: shows validation error when fields empty
    - Test: redirects to dashboard on success
    - Test: shows error message on auth failure
    - Test: shows loading state during submission
    - Test: redirects authenticated user away from login
    - _Requirements: 1.1–1.7_

- [ ] 5. Implement Dashboard page
  - [ ] 5.1 Create DashboardPage component
    - Create `src/pages/DashboardPage.tsx` with welcome message including username from `useAuth()`
    - Render quick-action cards using `getPermittedContentTypes(role)` — each card links to the "Add" form for that content type
    - For ambassador role, display focus area from profile; if not set, show "No focus area assigned" message
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.2 Write unit tests for DashboardPage
    - Test: renders welcome message with username
    - Test: renders all 4 quick-action cards for student/ambassador roles
    - Test: renders only 2 cards for professor/null roles
    - Test: shows focus area for ambassador; shows placeholder when missing
    - _Requirements: 4.1–4.5_

- [ ] 6. Implement shared form components
  - [ ] 6.1 Create FormField and FormActions components
    - Create `src/components/forms/FormField.tsx` supporting types: text, textarea, richtext, datetime, select
    - Display validation errors in red (#dc2626) below the input (within 8px), min 14px font
    - Create `src/components/forms/FormActions.tsx` with submit button (disabled + loading indicator when `isLoading`) and optional cancel button
    - Ensure 44x44px minimum touch targets for buttons
    - _Requirements: 12.2, 12.4, 12.5_

- [ ] 7. Implement content listing page
  - [ ] 7.1 Create ContentListPage component
    - Create `src/pages/content/ContentListPage.tsx` accepting `contentType`, `displayName`, `nameField` props
    - Use `useApiQuery` with pagination (default 25 per page) to fetch content
    - Render table/cards showing entity name and creation date
    - Clicking an entity navigates to its edit page
    - Show loading indicator while fetching
    - Show error message + retry button on fetch failure
    - Show empty state with link to creation form when no records exist
    - Display previous/next pagination controls when total > 25, showing current page/total pages
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 7.2 Write unit tests for ContentListPage
    - Test: renders entities with name and date
    - Test: displays loading indicator
    - Test: shows error + retry on failure
    - Test: shows empty state with create link
    - Test: pagination controls appear when needed
    - _Requirements: 5.1–5.7_

- [ ] 8. Implement content creation pages
  - [ ] 8.1 Create CreateClubPage
    - Create `src/pages/content/CreateClubPage.tsx` with name (required, max 255) and description (optional, rich text) fields
    - Use `useApiMutation` with `activityClubService.create`; set current user as owner; create in draft state
    - Run `validateClubForm` on submit; show field errors if invalid
    - On success, navigate to activity clubs listing
    - On backend error (including uniqueness violation), display error, preserve data
    - Disable submit + show loading while in progress
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 8.2 Create CreateBuildingPage
    - Create `src/pages/content/CreateBuildingPage.tsx` with name (required), code (required), address (required), campus (optional, dropdown fetched from backend)
    - Use `useApiMutation` with `buildingService.create`
    - Run `validateBuildingForm` on submit; show field errors if invalid
    - On success, navigate to buildings listing
    - On backend error (including address uniqueness), display error, preserve data
    - Disable submit + show loading while in progress
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 8.3 Create CreateEventPage
    - Create `src/pages/content/CreateEventPage.tsx` with title (required, max 255), description (optional, rich text), starts_at (required, datetime), ends_at (required, datetime), event_status (required, dropdown: planned/ongoing/completed/cancelled), location (optional, dropdown fetched from backend)
    - Use `useApiMutation` with `eventService.create`; set current user as creator
    - Run `validateEventForm` on submit (including date ordering check); show field errors if invalid
    - On success, navigate to events listing
    - On backend error, display error, preserve data
    - Disable submit + show loading while in progress
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 8.4 Create CreateNewsArticlePage
    - Create `src/pages/content/CreateNewsArticlePage.tsx` with title (required, max 255), summary (optional, text), body (required, rich text)
    - Use `useApiMutation` with `newsArticleService.create`; set current user as author
    - Run `validateNewsArticleForm` on submit; show field errors if invalid
    - On success, navigate to news articles listing
    - On backend error, display error, preserve data
    - Disable submit + show loading while in progress
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 8.5 Write unit tests for creation pages
    - Test each creation page: form renders, validation errors display, success navigates, backend errors preserved
    - _Requirements: 6.1–6.6, 7.1–7.6, 8.1–8.6, 9.1–9.5_

- [ ] 9. Implement content edit pages
  - [ ] 9.1 Create edit pages for each content type
    - Create `src/pages/content/EditClubPage.tsx`, `EditBuildingPage.tsx`, `EditEventPage.tsx`, `EditNewsArticlePage.tsx`
    - Each page: fetch entity by documentId (from route param), pre-populate form with existing values
    - Use same validation functions as creation forms
    - On submit, use `useApiMutation` with the service's `update` method; navigate to listing on success
    - Show loading indicator while fetching entity data
    - Show "not found" message with listing link on 404 response
    - On backend error during update, display error, preserve changes
    - Disable submit + show loading while update in progress
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 9.2 Write property test for edit/create validation identity
    - **Property 6: Edit Validation Matches Create Validation**
    - For arbitrary form data, assert that validation during edit produces identical results to creation
    - **Validates: Requirements 10.4**

  - [ ]* 9.3 Write unit tests for edit pages
    - Test: pre-populates form with fetched data
    - Test: shows loading while fetching
    - Test: shows 404 message when entity not found
    - Test: updates successfully and navigates
    - Test: shows backend error, preserves changes
    - _Requirements: 10.1–10.7_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Wire routing and integrate all pages
  - [ ] 11.1 Connect all pages to router and finalize navigation
    - Register all page components in `src/router.tsx` with the correct paths and nesting
    - Ensure protected routes are wrapped with AuthGuard
    - Ensure content list pages pass correct `contentType`, `displayName`, and `nameField` props
    - Verify login redirects to stored path after authentication
    - _Requirements: 3.1, 3.5, 3.6, 11.1, 11.2, 11.3, 11.4_

  - [ ] 11.2 Apply visual design system globally
    - Update `src/index.css` with base styles: white background, 16px min body font, heading size hierarchy (1.5x, 1.25x)
    - Ensure accent color (#d54407) is applied consistently to buttons, active states, focus outlines
    - Ensure all interactive elements meet 44x44px minimum touch target
    - Ensure 4.5:1 contrast ratio for body text and 3:1 for large text
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_

  - [ ]* 11.3 Write integration tests for auth flow
    - Test: login → token storage → profile fetch → dashboard render
    - Test: session restoration from stored token
    - Test: 401 interceptor triggers logout on non-auth endpoints
    - Test: redirect to stored path after login
    - _Requirements: 1.3, 2.1, 2.4, 11.2_

  - [ ]* 11.4 Write property test for AuthGuard redirect
    - **Property 7: Protected Route Redirect for Unauthenticated Users**
    - For any path not equal to `/login`, when unauthenticated, AuthGuard stores path and redirects to `/login`
    - **Validates: Requirements 11.1**

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `apiClient`, `useApiQuery`, `useApiMutation`, content services, and `AuthProvider` are reused — no need to reimplement them
- React Router v7 must be installed as a new dependency (`react-router`)
- `fast-check` and `msw` are already in devDependencies

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["4.1", "6.1"] },
    { "id": 4, "tasks": ["4.2", "5.1", "7.1"] },
    { "id": 5, "tasks": ["5.2", "7.2", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["8.5", "9.1"] },
    { "id": 7, "tasks": ["9.2", "9.3"] },
    { "id": 8, "tasks": ["11.1", "11.2"] },
    { "id": 9, "tasks": ["11.3", "11.4"] }
  ]
}
```
