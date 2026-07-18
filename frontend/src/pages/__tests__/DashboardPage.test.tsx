import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { DashboardPage } from '../DashboardPage';
import type { AuthContextValue } from '../../context/auth-context';

const defaultAuth: AuthContextValue = {
  user: { id: 1, username: 'JohnDoe', email: 'john@example.com' },
  role: 'student',
  profile: null,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

let mockAuthValue: AuthContextValue = { ...defaultAuth };

vi.mock('../../context/auth-context', () => ({
  useAuth: () => mockAuthValue,
}));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockAuthValue = { ...defaultAuth };
  });

  it('renders welcome message with username', () => {
    mockAuthValue = { ...defaultAuth, user: { id: 1, username: 'JohnDoe', email: 'john@example.com' } };
    renderDashboard();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome, JohnDoe');
  });

  it('renders all 4 quick-action cards for student role', () => {
    mockAuthValue = { ...defaultAuth, role: 'student' };
    renderDashboard();

    expect(screen.getByText('Add Activity Club')).toBeInTheDocument();
    expect(screen.getByText('Add Building')).toBeInTheDocument();
    expect(screen.getByText('Add Event')).toBeInTheDocument();
    expect(screen.getByText('Add News Article')).toBeInTheDocument();
  });

  it('renders all 4 quick-action cards for ambassador role', () => {
    mockAuthValue = { ...defaultAuth, role: 'ambassador' };
    renderDashboard();

    expect(screen.getByText('Add Activity Club')).toBeInTheDocument();
    expect(screen.getByText('Add Building')).toBeInTheDocument();
    expect(screen.getByText('Add Event')).toBeInTheDocument();
    expect(screen.getByText('Add News Article')).toBeInTheDocument();
  });

  it('renders only 2 cards for professor role', () => {
    mockAuthValue = { ...defaultAuth, role: 'professor' };
    renderDashboard();

    expect(screen.queryByText('Add Activity Club')).not.toBeInTheDocument();
    expect(screen.getByText('Add Building')).toBeInTheDocument();
    expect(screen.queryByText('Add Event')).not.toBeInTheDocument();
    expect(screen.getByText('Add News Article')).toBeInTheDocument();
  });

  it('renders only 2 cards for null role', () => {
    mockAuthValue = { ...defaultAuth, role: null };
    renderDashboard();

    expect(screen.queryByText('Add Activity Club')).not.toBeInTheDocument();
    expect(screen.getByText('Add Building')).toBeInTheDocument();
    expect(screen.queryByText('Add Event')).not.toBeInTheDocument();
    expect(screen.getByText('Add News Article')).toBeInTheDocument();
  });

  it('shows focus area text for ambassador when focus_area is set', () => {
    mockAuthValue = {
      ...defaultAuth,
      role: 'ambassador',
      profile: { focus_area: 'student_engagement' },
    };
    renderDashboard();

    expect(screen.getByText('Student Engagement')).toBeInTheDocument();
  });

  it('shows "No focus area assigned" placeholder for ambassador when focus_area is not set', () => {
    mockAuthValue = {
      ...defaultAuth,
      role: 'ambassador',
      profile: {},
    };
    renderDashboard();

    expect(screen.getByText('No focus area assigned')).toBeInTheDocument();
  });

  it('does not show focus area section for non-ambassador roles', () => {
    mockAuthValue = { ...defaultAuth, role: 'student' };
    renderDashboard();

    expect(screen.queryByText('Focus Area')).not.toBeInTheDocument();
    expect(screen.queryByText('No focus area assigned')).not.toBeInTheDocument();
  });
});
