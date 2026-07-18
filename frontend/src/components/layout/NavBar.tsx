import { NavLink } from 'react-router';
import { truncateUsername } from '../../utils/format';

export interface NavBarProps {
  username: string;
  onLogout: () => void;
}

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/activity-clubs', label: 'Activity Clubs' },
  { to: '/buildings', label: 'Buildings' },
  { to: '/events', label: 'Events' },
  { to: '/news-articles', label: 'News Articles' },
];

export function NavBar({ username, onLogout }: NavBarProps) {
  return (
    <nav aria-label="Main navigation" style={styles.nav}>
      <ul style={styles.linkList}>
        {navLinks.map(({ to, label }) => (
          <li key={to} style={styles.linkItem}>
            <NavLink
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div style={styles.rightSection}>
        <span style={styles.username} title={username}>
          {truncateUsername(username)}
        </span>
        <button
          type="button"
          onClick={onLogout}
          style={styles.logoutButton}
          aria-label="Log out"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #e5e7eb',
  },
  linkList: {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: '4px',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    padding: '8px 12px',
    textDecoration: 'none',
    color: '#374151',
    fontWeight: 500,
    borderRadius: '4px',
    fontSize: '14px',
  },
  activeLink: {
    color: '#d54407',
    borderBottom: '2px solid #d54407',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  username: {
    fontSize: '14px',
    color: '#374151',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
