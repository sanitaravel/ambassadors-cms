import { createBrowserRouter } from 'react-router';
import { AuthGuard } from './components/auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContentListPage } from './pages/content/ContentListPage';
import { CreateClubPage } from './pages/content/CreateClubPage';
import { CreateEventPage } from './pages/content/CreateEventPage';
import { CreateClubEventPage } from './pages/content/CreateClubEventPage';
import { CreateNewsArticlePage } from './pages/content/CreateNewsArticlePage';
import { EditClubPage } from './pages/content/EditClubPage';
import { EditEventPage } from './pages/content/EditEventPage';
import { EditNewsArticlePage } from './pages/content/EditNewsArticlePage';
import { ViewClubPage } from './pages/content/ViewClubPage';
import { ViewEventPage } from './pages/content/ViewEventPage';
import { ViewNewsArticlePage } from './pages/content/ViewNewsArticlePage';

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
          { path: '/activity-clubs', element: <ContentListPage contentType="activity-clubs" displayName="Activity Clubs" /> },
          { path: '/activity-clubs/new', element: <CreateClubPage /> },
          { path: '/activity-clubs/:id', element: <ViewClubPage /> },
          { path: '/activity-clubs/:id/edit', element: <EditClubPage /> },
          { path: '/activity-clubs/:clubId/events/new', element: <CreateClubEventPage /> },
          { path: '/events', element: <ContentListPage contentType="events" displayName="Events" /> },
          { path: '/events/new', element: <CreateEventPage /> },
          { path: '/events/:id', element: <ViewEventPage /> },
          { path: '/events/:id/edit', element: <EditEventPage /> },
          { path: '/news-articles', element: <ContentListPage contentType="news-articles" displayName="News Articles" /> },
          { path: '/news-articles/new', element: <CreateNewsArticlePage /> },
          { path: '/news-articles/:id', element: <ViewNewsArticlePage /> },
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
