import { createBrowserRouter } from 'react-router';
import { AuthGuard } from './components/auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContentListPage } from './pages/content/ContentListPage';

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
          { path: '/activity-clubs', element: <ContentListPage contentType="activity-clubs" displayName="Activity Clubs" nameField="name" /> },
          { path: '/activity-clubs/new', element: <CreateClubPage /> },
          { path: '/activity-clubs/:id/edit', element: <EditClubPage /> },
          { path: '/buildings', element: <ContentListPage contentType="buildings" displayName="Buildings" nameField="name" /> },
          { path: '/buildings/new', element: <CreateBuildingPage /> },
          { path: '/buildings/:id/edit', element: <EditBuildingPage /> },
          { path: '/events', element: <ContentListPage contentType="events" displayName="Events" nameField="title" /> },
          { path: '/events/new', element: <CreateEventPage /> },
          { path: '/events/:id/edit', element: <EditEventPage /> },
          { path: '/news-articles', element: <ContentListPage contentType="news-articles" displayName="News Articles" nameField="title" /> },
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
