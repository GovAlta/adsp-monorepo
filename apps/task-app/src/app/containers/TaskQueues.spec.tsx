import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v7';
import { TaskQueues } from './TaskQueues';
import { loadQueues, queuesSelector, queueMetricsSelector, metricsLoadingSelector } from '../state';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../state', () => ({
  loadQueues: jest.fn(() => ({ type: 'queue/loadQueues' })),
  queuesSelector: jest.fn(),
  queueMetricsSelector: jest.fn(),
  metricsLoadingSelector: jest.fn(),
}));

jest.mock('../components/QueuesHeader', () => ({
  QueuesHeader: () => <div data-testid="queues-header" />,
}));

jest.mock('../components/QueueList', () => ({
  QueueList: ({ onOpenQueue }: { onOpenQueue: (queue: { namespace: string; name: string }) => void }) => (
    <button data-testid="open-queue" onClick={() => onOpenQueue({ namespace: 'camps', name: 'intake' })} />
  ),
}));

describe('TaskQueues', () => {
  const queues = [
    { namespace: 'camps', name: 'intake', description: 'Camp intake queue', assignerRoles: [], workerRoles: [] },
  ];
  let mockDispatch: jest.Mock;
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigate = jest.fn();

    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === queuesSelector) return queues;
      if (selector === queueMetricsSelector) return {};
      if (selector === metricsLoadingSelector) return {};
      return undefined;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('dispatches loadQueues on mount', () => {
    // Arrange & Act
    render(<TaskQueues />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loadQueues());
  });

  it('navigates to the queue path when a queue is opened', () => {
    // Arrange
    render(<TaskQueues />);

    // Act
    screen.getByTestId('open-queue').click();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('camps/intake');
  });
});
