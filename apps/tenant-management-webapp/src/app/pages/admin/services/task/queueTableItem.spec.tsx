import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueueTableItem } from './queueTableItem';
import { TaskDefinition } from '@store/task/model';
import { BrowserRouter as Router } from 'react-router-dom';
import { useSelector } from 'react-redux';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

describe('QueueTableItem Component', () => {
  const taskAppUrl = 'http://localhost:3000';
  const queue: TaskDefinition = {
    namespace: 'namespace1',
    name: 'Queue1',
    id: '1',
  } as TaskDefinition;

  beforeEach(() => {
    (useSelector as jest.Mock).mockReturnValue(taskAppUrl);
  });

  it('should render the component', async () => {
    const { queryByTestId } = render(<QueueTableItem id="1" queue={queue} />);
    const namespaceId = queryByTestId('queue-list-namespace');
    const nameId = queryByTestId('queue-list-name');
    const actionId = queryByTestId('queue-list-action');
    await waitFor(() => {
      expect(namespaceId).toBeInTheDocument();
      expect(nameId).toBeInTheDocument();
      expect(actionId).toBeInTheDocument();
    });
  });

  it('should display the queue information', () => {
    render(<QueueTableItem id="1" queue={queue} />);
    expect(screen.getByTestId('queue-list-namespace')).toHaveTextContent('namespace1');
    expect(screen.getByTestId('queue-list-name')).toHaveTextContent('Queue1');
  });

  it('should have 3 action items', () => {
    render(<QueueTableItem id="1" queue={queue} />);
    expect(screen.getByTestId('task-app-open')).toBeInTheDocument();
    expect(screen.getByTestId('task-definition-edit')).toBeInTheDocument();
    expect(screen.getByTestId('task-definition-delete')).toBeInTheDocument();
  });

  it('should handle the "Open Task" action', async () => {
    window.open = jest.fn();
    render(<QueueTableItem id="1" queue={queue} />);
    const openButton = screen.getByTestId('task-app-open');
    fireEvent(openButton, new CustomEvent('_click'));
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(`${taskAppUrl}/namespace1/Queue1`);
    });
  });

  it('should handle the "Delete" action', () => {
    const onDeleteMock = jest.fn();
    render(<QueueTableItem id="1" queue={queue} onDelete={onDeleteMock} />);
    const deleteButton = screen.getByTestId('task-definition-delete');
    fireEvent(deleteButton, new CustomEvent('_click'));
  });
});
