import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { ContentListPage } from '../content/ContentListPage';

const mockRefetch = vi.fn();
const mockNavigate = vi.fn();

let mockQueryState: Record<string, unknown> = {};

vi.mock('../../hooks/use-api-query', () => ({
  useApiQuery: () => mockQueryState,
}));

vi.mock('../../api/content-service', () => ({
  createContentService: () => ({
    getMany: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderComponent(props?: Partial<{ contentType: string; displayName: string; nameField: string }>) {
  return render(
    <MemoryRouter initialEntries={['/events']}>
      <ContentListPage
        contentType={(props?.contentType as 'events') ?? 'events'}
        displayName={props?.displayName ?? 'Events'}
        nameField={props?.nameField ?? 'title'}
      />
    </MemoryRouter>,
  );
}

describe('ContentListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryState = {};
  });

  it('renders entities with name and date', () => {
    mockQueryState = {
      data: {
        data: [
          { id: 1, documentId: 'doc-1', title: 'Summer Fest', createdAt: '2024-03-15T10:00:00.000Z' },
          { id: 2, documentId: 'doc-2', title: 'Open Day', createdAt: '2024-04-20T14:30:00.000Z' },
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 2 } },
      },
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn(),
    };

    renderComponent();

    expect(screen.getByText('Summer Fest')).toBeInTheDocument();
    expect(screen.getByText('Open Day')).toBeInTheDocument();
    // Check that dates are rendered (formatted)
    expect(screen.getByText(/Mar.*15.*2024/)).toBeInTheDocument();
    expect(screen.getByText(/Apr.*20.*2024/)).toBeInTheDocument();
  });

  it('displays loading indicator', () => {
    mockQueryState = {
      data: null,
      isLoading: true,
      error: null,
      isSuccess: false,
      refetch: vi.fn(),
    };

    renderComponent();

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('shows error and retry on failure', () => {
    mockQueryState = {
      data: null,
      isLoading: false,
      error: { status: 500, name: 'ServerError', message: 'Something went wrong' },
      isSuccess: false,
      refetch: mockRefetch,
    };

    renderComponent();

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    const callsBefore = mockRefetch.mock.calls.length;
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(callsBefore + 1);
  });

  it('shows empty state with create link', () => {
    mockQueryState = {
      data: {
        data: [],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
      },
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn(),
    };

    renderComponent();

    expect(screen.getByText('No events found.')).toBeInTheDocument();
    const createLink = screen.getByRole('link', { name: /create your first one/i });
    expect(createLink).toBeInTheDocument();
    expect(createLink).toHaveAttribute('href', '/events/new');
  });

  it('pagination controls appear when needed', () => {
    mockQueryState = {
      data: {
        data: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          documentId: `doc-${i + 1}`,
          title: `Event ${i + 1}`,
          createdAt: '2024-01-01T00:00:00.000Z',
        })),
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 3, total: 60 } },
      },
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn(),
    };

    renderComponent();

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});
