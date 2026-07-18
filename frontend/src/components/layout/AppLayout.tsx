import { Outlet } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { NavBar } from './NavBar';

/**
 * Main application layout rendered for all authenticated pages.
 * Displays the NavBar at the top and renders nested route content below.
 */
export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={styles.container}>
      <NavBar
        username={user?.username ?? ''}
        onLogout={logout}
      />
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
  },
  main: {
    padding: '24px',
  },
};
