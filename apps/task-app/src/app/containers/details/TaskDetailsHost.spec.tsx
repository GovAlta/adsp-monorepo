import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-v7';
import { TaskDetailsHost } from './TaskDetailsHost';
import { getRegisteredDetailsComponents } from './register';
import {
  openTask,
  queueUserSelector,
  openTaskSelector,
  busySelector,
  topicsSelector,
  selectedTopicSelector,
} from '../../state';
import { Task } from '../../state';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../state', () => ({
  openTask: jest.fn((payload) => ({ type: 'task/openTask', payload })),
  startTask: jest.fn((payload) => ({ type: 'task/startTask', payload })),
  completeTask: jest.fn((payload) => ({ type: 'task/completeTask', payload })),
  cancelTask: jest.fn((payload) => ({ type: 'task/cancelTask', payload })),
  queueUserSelector: jest.fn(),
  openTaskSelector: jest.fn(),
  busySelector: jest.fn(),
  topicsSelector: jest.fn(),
  selectedTopicSelector: jest.fn(),
}));

jest.mock('./register', () => ({
  getRegisteredDetailsComponents: jest.fn(),
}));

jest.mock('./FileTask', () => ({}));
jest.mock('./FormTask', () => ({}));
jest.mock('./FormSubmissionReviewTask', () => ({}));

describe('TaskDetailsHost', () => {
  const openTaskRecord = { id: 'task-1', urn: 'urn:ads:platform:task-service:v1:/tasks/task-1' } as Task;
  let mockDispatch: jest.Mock;

  const setupSelectors = (overrides: { open?: Task } = {}) => {
    const open = 'open' in overrides ? overrides.open : openTaskRecord;

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === queueUserSelector) return { id: 'user-1', name: 'Jane Doe' };
      if (selector === openTaskSelector) return open;
      if (selector === busySelector) return { executing: false };
      if (selector === topicsSelector) return {};
      if (selector === selectedTopicSelector) return null;
      return undefined;
    });
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useParams as jest.Mock).mockReturnValue({ namespace: 'camps', name: 'intake', taskId: 'task-1' });
    (getRegisteredDetailsComponents as jest.Mock).mockReturnValue([
      {
        matcher: () => true,
        detailsComponent: ({ task }: { task: Task }) => <div data-testid="task-details">{task.id}</div>,
      },
    ]);
    setupSelectors();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('dispatches openTask when the route taskId differs from the open task', () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ namespace: 'camps', name: 'intake', taskId: 'task-2' });

    // Act
    render(<TaskDetailsHost onClose={jest.fn()} />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(openTask({ namespace: 'camps', name: 'intake', taskId: 'task-2' }));
  });

  it('does not dispatch openTask when the route taskId matches the open task', () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ namespace: 'camps', name: 'intake', taskId: 'task-1' });

    // Act
    render(<TaskDetailsHost onClose={jest.fn()} />);

    // Assert
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('renders the matched details component for the open task', () => {
    // Arrange & Act
    render(<TaskDetailsHost onClose={jest.fn()} />);

    // Assert
    expect(screen.getByTestId('task-details')).toHaveTextContent('task-1');
  });

  it('renders nothing when no task is open', () => {
    // Arrange
    setupSelectors({ open: undefined });

    // Act
    render(<TaskDetailsHost onClose={jest.fn()} />);

    // Assert
    expect(screen.queryByTestId('task-details')).not.toBeInTheDocument();
  });
});
