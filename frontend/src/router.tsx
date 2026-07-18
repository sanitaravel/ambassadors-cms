import { createBrowserRouter } from 'react-router';
import { AuthGuard } from './components/auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/LoginPage';

function DashboardPage() {
  return <div>Dashboard</div>;
}

function ContentListPage() {
  return <div>Content List</div>;
}

function CreateClubPage() {
  return <div>Create Club</div>;
}

function EditClubPage() {
  return <div>Edit Club</div>;
}

function CreateBuildingPage() {
  return <div>Create Building</div>;
}

function EditBuildingPage() {
  return <div>Edit Building</div>;
}

function CreateEventPage() {
  return <div>Create Event</div>;
}

function EditEventPage() {
  return <div>Edit Event</div>;
}

function CreateNewsArticlePage() {
  return <div>Create News Article</div>;
}

function EditNewsArticlePage() {
  return <div>Edit News Article</div>;
}

// AuthGuard imported from src/components/auth/AuthGuard.tsx
// AppLayout imported from src/components/layout/AppLayout.tsx

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Protected routes — wrapped by AuthGuard and AppLayout
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/activity-clubs', element: <ContentListPage /> },
          { path: '/activity-clubs/new', element: <CreateClubPage /> },
          { path: '/activity-clubs/:id/edit', element: <EditClubPage /> },
          { path: '/buildings', element: <ContentListPage /> },
          { path: '/buildings/new', element: <CreateBuildingPage /> },
          { path: '/buildings/:id/edit', element: <EditBuildingPage /> },
          { path: '/events', element: <ContentListPage /> },
          { path: '/events/new', element: <CreateEventPage /> },
          { path: '/events/:id/edit', element: <EditEventPage /> },
          { path: '/news-articles', element: <ContentListPage /> },
          { path: '/news-articles/new', element: <CreateNewsArticlePage /> },
          { path: '/news-articles/:id/edit', element: <EditNewsArticlePage /> },
        ],
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
