# SRH Ambassador Platform

A content platform for SRH university ambassadors, students and professors. Contributors log in to a React web app to create and manage activity clubs, events and news articles. Administration (users, roles, permissions, content-type configuration) is handled in the Strapi admin panel.

The repository contains two applications:

| Directory   | Stack                                   | Purpose                                      |
| ----------- | --------------------------------------- | -------------------------------------------- |
| `backend/`  | Strapi 5, TypeScript, SQLite (default)  | REST API, data model, admin panel            |
| `frontend/` | React 19, TypeScript, Vite, React Router 7, Tiptap | Content contributor UI            |

## Features

- **Authentication** via the Strapi Users & Permissions plugin (JWT stored in `localStorage`, validated against `/api/users/me` on load, automatic logout on `401`).
- **Role-based access**: students and ambassadors can manage activity clubs, events and news articles; professors can manage news articles.
- **Content management**: list (with pagination), view, create and edit pages for each content type, with a rich text editor that produces Strapi Blocks.
- **Ownership checks**: activity clubs can only be updated or deleted by their owner (enforced in the backend controller); club owners can create events for their club.

## Data model

Strapi content types live in `backend/src/api/`:

`activity-club`, `ambassador-profile`, `building`, `campus`, `club-membership`, `event`, `event-attendee`, `issue`, `location`, `news-article`, `professor-profile`, `student-profile`, plus an extended `users-permissions` user.

An ER diagram is in [`backend/university-er-model.mmd`](backend/university-er-model.mmd) (Mermaid).

## Getting started

### Prerequisites

- Node.js 20–24
- npm

### 1. Backend

```bash
cd backend
cp .env.example .env   # then replace every "tobemodified" value with a random secret
npm install
npm run develop
```

The API runs at `http://localhost:1337/api` and the admin panel at `http://localhost:1337/admin`. On first start, create an admin account in the admin panel, then configure roles and permissions under **Settings → Users & Permissions**.

By default the backend uses SQLite (`backend/.tmp/data.db`). To use MySQL or Postgres, set `DATABASE_CLIENT` and the related `DATABASE_*` variables (see `backend/config/database.ts`).

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_STRAPI_URL=http://localhost:1337
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Scripts

### Backend (`backend/`)

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run develop` | Start Strapi with auto-reload                |
| `npm run start`   | Start Strapi without auto-reload             |
| `npm run build`   | Build the admin panel                        |

### Frontend (`frontend/`)

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Vite dev server                    |
| `npm run build`   | Type-check and build for production          |
| `npm run preview` | Preview the production build                 |
| `npm run lint`    | Run ESLint                                   |
| `npm test`        | Run the test suite (Vitest)                  |

## Frontend structure

```
frontend/src/
├── api/          # API client, token store, typed services per content type
├── components/   # Auth guard, layout/nav bar, form fields, rich text editor, Blocks renderer
├── context/      # Auth context (user, role, login/logout)
├── hooks/        # useApiQuery / useApiMutation
├── pages/        # Login, Dashboard, content list/view/create/edit pages
├── utils/        # Permission helpers
└── router.tsx    # Route definitions
```

Tests use Vitest, Testing Library, MSW for API mocking and fast-check for property-based tests.

## Specifications

Design documents, requirements and task lists are in [`.kiro/specs/`](.kiro/specs/):

- [`ambassador-ui`](.kiro/specs/ambassador-ui/) — the contributor UI
- [`frontend-backend-integration`](.kiro/specs/frontend-backend-integration/) — API client, auth and role-based data access
