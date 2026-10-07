import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom-v7';
import { useSelector } from 'react-redux';
import { TaskHeader } from './TaskHeader';
import { Task } from '../state';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('TaskHeader', () => {
  const openTask = { id: 'task-1', name: 'Review application' } as Task;

  beforeEach(() => {
    (useSelector as jest.Mock).mockReturnValue({ id: 'tenant-1', name: 'autotest' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const renderHeader = (props: Partial<React.ComponentProps<typeof TaskHeader>> = {}) => {
    return render(
      <MemoryRouter>
        <TaskHeader
          open={props.open}
          isLive={props.isLive ?? false}
          onClickTasks={props.onClickTasks ?? jest.fn()}
          namespace={props.namespace ?? 'camps'}
          name={props.name ?? 'intake'}
        />
      </MemoryRouter>,
    );
  };

  it('renders a link to the tenant queues list', () => {
    // Arrange & Act
    renderHeader();

    // Assert
    expect(screen.getByRole('link', { name: 'Queues' })).toHaveAttribute('href', '/autotest');
  });

  it('renders the queue namespace and name when no task is open', () => {
    // Arrange & Act
    const { container } = renderHeader({ open: undefined, namespace: 'camps', name: 'intake' });

    // Assert
    expect(container.textContent).toContain('Tasks (camps:intake)');
  });

  it('renders a task link to the queue when a task is open', () => {
    // Arrange & Act
    renderHeader({ open: openTask, namespace: 'camps', name: 'intake' });

    // Assert
    expect(screen.getByRole('link', { name: 'Tasks (camps:intake)' })).toHaveAttribute(
      'href',
      '/autotest/camps/intake',
    );
  });

  it('calls onClickTasks when the task link is clicked', () => {
    // Arrange
    const onClickTasks = jest.fn();
    renderHeader({ open: openTask, onClickTasks });

    // Act
    fireEvent.click(screen.getByRole('link', { name: 'Tasks (camps:intake)' }));

    // Assert
    expect(onClickTasks).toHaveBeenCalledTimes(1);
  });

  it('shows the Live badge when isLive is true', () => {
    // Arrange & Act
    const { container } = renderHeader({ isLive: true });

    // Assert
    expect(container.querySelector('goa-badge')).toHaveAttribute('content', 'Live');
  });

  it('shows the Not live badge when isLive is false', () => {
    // Arrange & Act
    const { container } = renderHeader({ isLive: false });

    // Assert
    expect(container.querySelector('goa-badge')).toHaveAttribute('content', 'Not live');
  });
});
