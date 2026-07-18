# Requirements Document

## Introduction

This feature provides a content contributor interface for the SRH Ambassador Platform. The UI enables authenticated users (ambassadors, students, professors) to log in, view their dashboard, add new content (activity clubs, buildings, events, news articles), and edit existing content. Administration (user management, permissions, content-type configuration) is handled entirely by the Strapi admin panel — this Vite/React frontend is solely for content contributors. The frontend is built with React and TypeScript (Vite) and communicates with a Strapi v5 backend via a REST API. The visual design uses a white background with #d54407 as the accent color.

## Glossary

- **Ambassador_UI**: The React-based single-page application providing content management capabilities to authenticated users
- **Auth_Module**: The authentication subsystem handling login, logout, session persistence, and role detection via Strapi Users & Permissions plugin
- **Content_Manager**: The UI module responsible for creating, listing, and editing content entities
- **Dashboard**: The landing page shown to authenticated users displaying a summary of their content and quick-action links
- **Strapi_Backend**: The Strapi v5 REST API serving content types including ambassador-profile, activity-club, building, campus, event, location, news-article, issue, and user profiles
- **Form_Component**: A reusable UI component that renders input fields corresponding to a content type schema and handles validation
- **Navigation_Bar**: The persistent top navigation element providing access to pages, user info, and logout
- **Accent_Color**: The color #d54407 used for interactive elements, buttons, links, and highlights
- **Content_Entity**: Any Strapi collection-type record (activity club, building, event, news article, etc.) that can be created or edited
- **Token_Store**: The localStorage key used to persist the JWT authentication token
- **API_Client**: The HTTP client layer responsible for attaching the JWT token to outgoing requests and intercepting responses
- **Student_Role**: A Strapi user role assigned to student users
- **Ambassador_Role**: A Strapi user role assigned to ambassador users
- **Professor_Role**: A Strapi user role assigned to professor users

## Requirements

### Requirement 1: User Login

**User Story:** As a user, I want to log in with my email and password, so that I can access the ambassador platform and manage content.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to the Ambassador_UI, THE Auth_Module SHALL display a login page with an email input field (maximum 254 characters), a password input field (maximum 128 characters), and a submit button styled with Accent_Color.
2. IF the user attempts to submit the login form with an empty email field or an empty password field, THEN THE Auth_Module SHALL prevent submission and display a validation message indicating the empty field is required.
3. WHEN a user submits valid credentials and the Strapi_Backend returns a successful authentication response, THE Auth_Module SHALL store the JWT token in localStorage and redirect the user to the Dashboard.
4. IF the Strapi_Backend returns an authentication error, THEN THE Auth_Module SHALL display the error message below the login form, retain the email field value, and clear the password field.
5. IF the Auth_Service returns a network connectivity or timeout error, THEN THE Auth_Module SHALL display an error message below the login form indicating the service is unreachable and retain both field values.
6. WHILE the login request is in progress, THE Auth_Module SHALL disable the submit button and display a loading indicator adjacent to or within the submit button.
7. IF an already-authenticated user navigates to the login page, THEN THE Auth_Module SHALL redirect the user to the Dashboard without displaying the login form.

### Requirement 2: Session Persistence and Logout

**User Story:** As a user, I want my session to persist across page reloads and be able to log out, so that I do not need to re-authenticate on every visit.

#### Acceptance Criteria

1. WHEN the Frontend application loads and a JWT token exists in the Token_Store, THE Auth_Module SHALL validate the token by sending a GET request to `/api/users/me` and, upon receiving a successful response, set the authentication state to authenticated and render the Dashboard route within 3 seconds of page load.
2. IF the Token_Store contains a JWT token and the `/api/users/me` request returns a 401 status or the token cannot be parsed as a valid JWT structure, THEN THE Auth_Module SHALL remove the token from the Token_Store, set the authentication state to unauthenticated, and navigate the user to the login page.
3. WHEN an authenticated user activates the logout control in the Navigation_Bar, THE Auth_Module SHALL remove the JWT token from the Token_Store, set the user object to null, set `isAuthenticated` to false, set the role to null, and navigate to the login page.
4. WHEN the API_Client receives a 401 response from the Strapi_Backend on any endpoint other than `/api/auth/local` and `/api/auth/local/register`, THE Auth_Module SHALL remove the JWT token from the Token_Store, set the authentication state to unauthenticated, and navigate the user to the login page.
5. IF no JWT token exists in the Token_Store when the Frontend application loads, THEN THE Auth_Module SHALL set the authentication state to unauthenticated and navigate the user to the login page without making any network requests.

### Requirement 3: Navigation and Layout

**User Story:** As an authenticated user, I want a clear navigation structure, so that I can easily access different sections of the platform.

#### Acceptance Criteria

1. THE Ambassador_UI SHALL render a Navigation_Bar at the top of every authenticated page containing links to Dashboard, Activity Clubs, Buildings, Events, and News Articles.
2. THE Navigation_Bar SHALL display the current user's username (truncated to 20 characters with ellipsis if longer) and a logout button on the right side.
3. THE Ambassador_UI SHALL use a white (#FFFFFF) background for all pages.
4. THE Ambassador_UI SHALL use Accent_Color (#d54407) for primary buttons, active navigation links, and interactive element hover states.
5. WHEN a user navigates to a route that does not exist, THE Ambassador_UI SHALL display a 404 page with a descriptive message and a link back to the Dashboard.
6. WHEN an unauthenticated user attempts to access any authenticated page, THE Navigation_Bar SHALL not be rendered and the user SHALL be redirected to the login page.

### Requirement 4: Dashboard

**User Story:** As an authenticated user, I want to see a dashboard after login, so that I can get an overview of my content and quick access to actions.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to the Dashboard, THE Ambassador_UI SHALL display a welcome message containing the user's username as provided by the authentication context.
2. WHEN the authenticated user has Student_Role or Ambassador_Role, THE Dashboard SHALL display quick-action cards for "Add Activity Club", "Add Building", "Add Event", and "Add News Article" that navigate to the respective creation forms.
3. IF the authenticated user has no role (role is null) or has only Professor_Role, THEN THE Dashboard SHALL display only the "Add Building" and "Add News Article" quick-action cards.
4. WHEN the user has Ambassador_Role, THE Dashboard SHALL display the user's ambassador profile focus area value from the ambassador profile data exposed by the authentication context.
5. IF the user has Ambassador_Role and the ambassador profile focus area is not set, THEN THE Dashboard SHALL display the focus area section with a message indicating no focus area has been assigned.

### Requirement 5: Content Listing

**User Story:** As an authenticated user, I want to see a list of existing content entries, so that I can review and select items to edit.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to a content listing page, THE Content_Manager SHALL fetch and display Content_Entity records of that type from the Strapi_Backend with pagination defaulting to 25 items per page.
2. THE Content_Manager SHALL display each Content_Entity in a table or card layout showing the entity name and creation date.
3. WHEN the user clicks on a Content_Entity in the listing, THE Content_Manager SHALL navigate to the edit form for that entity.
4. WHILE Content_Entity records are being fetched from the Strapi_Backend, THE Content_Manager SHALL display a loading indicator.
5. IF the Strapi_Backend returns an error during content fetching, THEN THE Content_Manager SHALL display an error message with a retry button.
6. IF the Strapi_Backend returns zero Content_Entity records, THEN THE Content_Manager SHALL display an empty state message indicating no records exist with a link to the creation form for that content type.
7. THE Content_Manager SHALL display pagination controls (previous/next) when the total record count exceeds 25, indicating the current page number and total pages.

### Requirement 6: Create Activity Club

**User Story:** As an authenticated user, I want to create a new activity club, so that I can organize student activities on the platform.

#### Acceptance Criteria

1. WHEN a user navigates to the "Add Activity Club" page, THE Form_Component SHALL display input fields for club name (required, text, maximum 255 characters) and description (optional, rich text).
2. WHEN the user submits a valid club creation form, THE Content_Manager SHALL send a POST request to the Strapi_Backend with the club data and the current user as owner, creating the club in draft (unpublished) state, then navigate to the content listing page.
3. IF the club name field is empty or contains only whitespace on submission, THEN THE Form_Component SHALL display a validation error "Club name is required" without sending a request.
4. IF the Strapi_Backend returns an error during club creation, THEN THE Content_Manager SHALL display the error message returned by the backend on the form page while preserving the user's entered data.
5. WHILE the create request is in progress, THE Form_Component SHALL disable the submit button and display a loading indicator.
6. IF the Strapi_Backend returns a uniqueness violation for the club name, THEN THE Content_Manager SHALL display an error message indicating a club with that name already exists, while preserving the user's entered data.

### Requirement 7: Create Building

**User Story:** As an authenticated user, I want to add a new building, so that campus locations can be properly cataloged.

#### Acceptance Criteria

1. WHEN a user navigates to the "Add Building" page, THE Form_Component SHALL display input fields for building name (required, text), code (required, text), address (required, text), and campus (optional, dropdown populated from the Strapi_Backend).
2. WHEN the user submits a valid building creation form, THE Content_Manager SHALL send a POST request to the Strapi_Backend with the building data, then navigate to the content listing page.
3. IF any required field is empty on submission, THEN THE Form_Component SHALL display a validation error for each missing field without sending a request.
4. IF the Strapi_Backend returns a uniqueness violation for the address field, THEN THE Content_Manager SHALL display an error message indicating a building with that address already exists.
5. IF the Strapi_Backend returns an error other than a uniqueness violation during building creation, THEN THE Content_Manager SHALL display the error message on the form page without losing user input.
6. WHILE the create request is in progress, THE Form_Component SHALL disable the submit button and display a loading indicator.

### Requirement 8: Create Event

**User Story:** As an authenticated user, I want to create a new event, so that I can organize and announce activities for the university community.

#### Acceptance Criteria

1. WHEN a user navigates to the "Add Event" page, THE Form_Component SHALL display input fields for title (required, text, maximum 255 characters), description (optional, rich text), starts_at (required, datetime), ends_at (required, datetime), event_status (required, dropdown with values: planned, ongoing, completed, cancelled), and location (optional, dropdown populated from the Strapi_Backend).
2. WHEN the user submits a valid event creation form, THE Content_Manager SHALL send a POST request to the Strapi_Backend with the event data and the current user as creator, then navigate to the content listing page.
3. IF the ends_at value is earlier than or equal to starts_at, THEN THE Form_Component SHALL display a validation error "End time must be after start time" without sending a request.
4. IF any required field is empty on submission, THEN THE Form_Component SHALL display a validation error for each missing field without sending a request.
5. IF the Strapi_Backend returns an error during event creation, THEN THE Content_Manager SHALL display the error message on the form page without losing user input.
6. WHILE the create request is in progress, THE Form_Component SHALL disable the submit button and display a loading indicator.

### Requirement 9: Create News Article

**User Story:** As an authenticated user, I want to write and publish news articles, so that I can share updates with the university community.

#### Acceptance Criteria

1. WHEN a user navigates to the "Add News Article" page, THE Form_Component SHALL display input fields for title (required, text, maximum 255 characters), summary (optional, text), and body (required, rich text).
2. WHEN the user submits a valid news article creation form, THE Content_Manager SHALL send a POST request to the Strapi_Backend with the article data and the current user as author, then navigate to the content listing page.
3. IF the title or body field is empty on submission, THEN THE Form_Component SHALL display a validation error for each missing field without sending a request.
4. IF the Strapi_Backend returns an error during article creation, THEN THE Content_Manager SHALL display the error message on the form page without losing user-entered data.
5. WHILE the create request is in progress, THE Form_Component SHALL disable the submit button and display a loading indicator.

### Requirement 10: Edit Content

**User Story:** As an authenticated user, I want to edit existing content entries, so that I can correct or update information.

#### Acceptance Criteria

1. WHEN a user navigates to the edit page for a Content_Entity, THE Content_Manager SHALL fetch the entity data from the Strapi_Backend and pre-populate the Form_Component with existing values.
2. WHEN the user modifies fields and submits the edit form, THE Content_Manager SHALL send a PUT request to the Strapi_Backend with the updated data, then navigate back to the content listing page.
3. IF the Strapi_Backend returns an error during content update, THEN THE Content_Manager SHALL display the error message on the edit form page without losing user changes.
4. THE Form_Component SHALL apply the same validation rules on edit as on creation for the corresponding Content_Entity type.
5. WHILE the edit form data is being fetched, THE Content_Manager SHALL display a loading indicator.
6. IF the Strapi_Backend returns a 404 response when fetching the entity for editing, THEN THE Content_Manager SHALL display an error message indicating the entity was not found and provide a link back to the content listing page.
7. WHILE the update request is in progress, THE Form_Component SHALL disable the submit button and display a loading indicator.

### Requirement 11: Protected Routes

**User Story:** As a user, I want content pages to be accessible only to authenticated users, so that unauthorized visitors cannot access the platform.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to navigate to any page other than the login page, THE Ambassador_UI SHALL redirect the user to the login page and store the originally requested path.
2. WHEN an authenticated user successfully logs in after being redirected, THE Ambassador_UI SHALL navigate the user to the stored originally requested path, then clear the stored path.
3. IF no stored redirect path exists after successful login, THEN THE Ambassador_UI SHALL navigate the user to the Dashboard.
4. THE Ambassador_UI SHALL check the Auth_Module's authentication state before rendering any protected route and redirect to the login page if the state is unauthenticated.

### Requirement 12: Visual Design System

**User Story:** As a user, I want a clean and consistent visual design, so that the platform feels professional and easy to use.

#### Acceptance Criteria

1. THE Ambassador_UI SHALL use #FFFFFF as the page background color for all views.
2. THE Ambassador_UI SHALL use #d54407 as the color for primary action buttons, active states, and focus outlines.
3. THE Ambassador_UI SHALL use a font size hierarchy where top-level headings are at least 1.5 times the body text font size and secondary headings are at least 1.25 times the body text font size, with body text rendered at a minimum of 16px.
4. THE Form_Component SHALL display validation errors in red (#dc2626) text positioned within 8px below the bottom edge of the corresponding input field, using a font size no smaller than 14px.
5. THE Ambassador_UI SHALL ensure all interactive elements have a minimum touch target size of 44x44 pixels for accessibility.
6. THE Ambassador_UI SHALL maintain a minimum contrast ratio of 4.5:1 between text and background colors for all body text and 3:1 for large text (18px or above) across all views.
