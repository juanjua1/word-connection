import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/task-card';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending' as const,
    priority: 'medium' as const,
    dueDate: '2025-01-01',
    isCompleted: false,
    isOverdue: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    userId: '2',
    categoryId: '1',
    assignedToUser: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'common' as const,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    user: {
      id: '2',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin' as const,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    category: {
      id: '1',
      name: 'Development',
      color: '#3b82f6',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  };

  const defaultProps = {
    task: mockTask,
    onComplete: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render task title and description', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should display priority badge', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should display assigned user', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show overdue badge when task is overdue', () => {
    const overduetask = {
      ...mockTask,
      isOverdue: true,
    };

    render(<TaskCard {...defaultProps} task={overduetask} />);
    
    expect(screen.getByText('Atrasada')).toBeInTheDocument();
  });

  it('should show completed status when task is completed', () => {
    const completedTask = {
      ...mockTask,
      isCompleted: true,
      status: 'completed' as const,
    };

    render(<TaskCard {...defaultProps} task={completedTask} />);
    
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });
});
