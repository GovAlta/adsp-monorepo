import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom-v7';
import { useDispatch, useSelector } from 'react-redux';
import TaskQueue from './TaskQueue';
import {
  initializeQueue,
  loadQueueMetrics,
  openTask,
  queueUserSelector,
  liveSelector,
  metricsSelector,
  metricsLoadingSelector,
  filterSelector,
  busySelector,
  modalSelector,
  tasksSelector,
  openTaskSelector,
  queueWorkersSelector,
} from '../state';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  ...jest.requireActual('react-router-dom-v7'),
  useParams: () => ({ tenant: 'autotest', namespace: 'camps', name: 'intake' }),
  useNavigate: () => mockNavigate,
}));

jest.mock('../state', () => ({
  assignTask: jest.fn((payload) => ({ type: 'task/assignTask', payload })),
  busySelector: jest.fn(),
  filterSelector: jest.fn(),
  liveSelector: jest.fn(),
  modalSelector: jest.fn(),
  openTaskSelector: jest.fn(),
  queueUserSelector: jest.fn(),
  queueWorkersSelector: jest.fn(),
  metricsSelector: jest.fn(),
  tasksSelector: jest.fn(),
  initializeQueue: jest.fn((payload) => ({ type: 'task/initializeQueue', payload })),
  setTaskPriority: jest.fn((payload) => ({ type: 'task/setTaskPriority', payload })),
  taskActions: {
    setFilter: jest.fn((payload) => ({ type: 'task/setFilter', payload })),
    setTaskToAssign: jest.fn((payload) => ({ type: 'task/setTaskToAssign', payload })),
    setTaskToPrioritize: jest.fn((payload) => ({ type: 'task/setTaskToPrioritize', payload })),
  },
  metricsLoadingSelector: jest.fn(),
  openTask: jest.fn((payload) => ({ type: 'task/openTask', payload })),
  loadQueueMetrics: jest.fn((payload) => ({ type: 'queue/loadQueueMetrics', payload })),
}));

jest.mock('../components/TaskAssignmentModal', () => ({
  TaskAssignmentModal: () => <div data-testid="assignment-modal" />,
}));
jest.mock('../components/TaskPriorityModal', () => ({
  TaskPriorityModal: () => <div data-testid="priority-modal" />,
}));
jest.mock('../components/TaskHeader', () => ({
  TaskHeader: ({ onClickTasks }: { onClickTasks: () => void }) => (
    <button data-testid="queue-header" onClick={onClickTasks} />
  ),
}));
jest.mock('../components/TaskList', () => ({
  TaskList: ({ onOpen }: { onOpen: (task: { id: string }) => void }) => (
    <button data-testid="task-list" onClick={() => onOpen({ id: 'task-1' })} />
  ),
}));
jest.mock('../components/LoadingIndicator', () => ({
  LoadingIndicator: () => <div data-testid="loading-indicator" />,
}));
jest.mock('./details/TaskDetailsHost', () => ({
  TaskDetailsHost: () => <div data-testid="task-details-host" />,
}));

describe('TaskQueue', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (busySelector as unknown as jest.Mock).mockReturnValue({ initializing: false, loading: false });
    (filterSelector as unknown as jest.Mock).mockReturnValue('active');
    (liveSelector as unknown as jest.Mock).mockReturnValue(true);
    (modalSelector as unknown as jest.Mock).mockReturnValue({ taskToAssign: null, taskToPrioritize: null });
    (openTaskSelector as unknown as jest.Mock).mockReturnValue(null);
    (queueUserSelector as unknown as jest.Mock).mockReturnValue({ id: 'user-1', name: 'Jane Doe' });
    (queueWorkersSelector as unknown as jest.Mock).mockReturnValue([]);
    (metricsSelector as unknown as jest.Mock).mockReturnValue({});
    (metricsLoadingSelector as unknown as jest.Mock).mockReturnValue({});
    (tasksSelector as unknown as jest.Mock).mockReturnValue([{ id: 'task-1', name: 'Review application' }]);

    (useSelector as jest.Mock).mockImplementation((selector) => selector(undefined));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const renderQueue = (initialEntry = '/') =>
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <TaskQueue />
      </MemoryRouter>,
    );

  it('dispatches initializeQueue for the routed namespace and name', () => {
    // Arrange & Act
    renderQueue();

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(initializeQueue({ namespace: 'camps', name: 'intake' }));
  });

  it('dispatches loadQueueMetrics for the routed namespace and name', () => {
    // Arrange & Act
    renderQueue();

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loadQueueMetrics({ namespace: 'camps', name: 'intake' }));
  });

  it('dispatches openTask for the routed namespace and name on mount', () => {
    // Arrange & Act
    renderQueue();

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(openTask({ namespace: 'camps', name: 'intake' }));
  });

  it('navigates to the queue root when the header tasks link is clicked', () => {
    // Arrange
    renderQueue();

    // Act
    fireEvent.click(screen.getByTestId('queue-header'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('');
  });

  it('navigates to the task when it is opened from the task list', () => {
    // Arrange
    renderQueue();

    // Act
    fireEvent.click(screen.getByTestId('task-list'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('task-1');
  });

  it('renders the task details host when the route includes a task id', () => {
    // Arrange & Act
    renderQueue('/task-1');

    // Assert
    expect(screen.getByTestId('task-details-host')).toBeInTheDocument();
  });

  it('renders the task list when the route is the queue root', () => {
    // Arrange & Act
    renderQueue('/');

    // Assert
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });
});
