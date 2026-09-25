import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { Agents } from './agents';
import { useNavigate } from 'react-router-dom';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('./agentsTable', () => ({
  AgentsTable: ({ isCore, agents, onEditAgent, onDeleteAgent }) => (
    <div data-testid={isCore ? 'core-table' : 'tenant-table'}>
      {agents?.map((agent) => (
        <div key={agent.id}>
          <span>{agent.name}</span>
          <button type="button" data-testid={`edit-${agent.id}`} onClick={() => onEditAgent?.(agent)}>
            edit
          </button>
          <button type="button" data-testid={`delete-${agent.id}`} onClick={() => onDeleteAgent?.(agent)}>
            delete
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./addEditAgentModal', () => ({
  AddEditAgentModal: ({ open, onCancel, onSave }) =>
    open ? (
      <div data-testid="add-edit-agent-modal">
        <button type="button" data-testid="modal-cancel" onClick={onCancel}>
          cancel
        </button>
        <button
          type="button"
          data-testid="modal-save"
          onClick={() =>
            onSave({
              id: 'new-agent',
              name: 'New Agent',
              instructions: 'Use the new workflow.',
            })
          }
        >
          save
        </button>
      </div>
    ) : null,
}));

jest.mock('@components/DeleteModal', () => ({
  DeleteModal: ({ isOpen, title, content, onCancel, onDelete }) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <div>{title}</div>
        {content}
        <button type="button" data-testid="delete-modal-cancel" onClick={onCancel}>
          cancel
        </button>
        <button type="button" data-testid="delete-modal-confirm" onClick={onDelete}>
          delete
        </button>
      </div>
    ) : null,
}));

jest.mock('@components/NoItem', () => ({
  renderNoItem: (itemName: string) => (
    <div data-testid={`no-item-${itemName.replace(/\s+/g, '-')}`}>{`No ${itemName} found`}</div>
  ),
}));

jest.mock('@abgov/react-components', () => ({
  GoabButton: ({ children, onClick, testId }) => (
    <button type="button" data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
  GoabCircularProgress: ({ visible }) => (visible ? <div data-testid="busy-indicator">busy</div> : null),
}));

describe('Agents', () => {
  const dispatch = jest.fn();
  const navigate = jest.fn();
  let state;

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
    (useNavigate as jest.Mock).mockReturnValue(navigate);
    state = {
      agent: {
        agents: {},
        busy: { loading: false },
      },
    };
    (useSelector as jest.Mock).mockImplementation((selector) => selector(state));
  });

  it('loads agents on mount and redirects to the agents page', () => {
    // Arrange
    state = {
      agent: {
        agents: {
          'tenant-1': { id: 'tenant-1', name: 'Tenant helper', instructions: 'Help', core: false },
        },
        busy: { loading: false },
      },
    };

    // Act
    render(<Agents openAddAgent={false} setOpenAddAgent={jest.fn()} />);

    // Assert
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(typeof dispatch.mock.calls[0][0]).toBe('function');
    expect(navigate).toHaveBeenCalledWith('../agents', { replace: true });
  });

  it('shows the empty state when there are no agents and no busy indicator is active', () => {
    // Arrange
    state = {
      agent: {
        agents: {},
        busy: { loading: false },
      },
    };

    // Act
    render(<Agents openAddAgent={false} setOpenAddAgent={jest.fn()} />);

    // Assert
    expect(screen.getByTestId('no-item-tenant-agents')).toHaveTextContent('No tenant agents found');
    expect(screen.getByTestId('no-item-core-agents')).toHaveTextContent('No core agents found');
  });

  it('opens the add-agent modal when the add button is clicked', () => {
    // Arrange
    const setOpenAddAgent = jest.fn();
    state = {
      agent: {
        agents: {
          'tenant-1': { id: 'tenant-1', name: 'Tenant helper', instructions: 'Help', core: false },
        },
        busy: { loading: false },
      },
    };

    // Act
    render(<Agents openAddAgent={false} setOpenAddAgent={setOpenAddAgent} />);
    fireEvent.click(screen.getByTestId('add-agent'));

    // Assert
    expect(setOpenAddAgent).toHaveBeenCalledWith(true);
  });

  it('renders tenant and core agent tables and triggers the update and delete thunks', () => {
    // Arrange
    const setOpenAddAgent = jest.fn();
    state = {
      agent: {
        agents: {
          'tenant-1': { id: 'tenant-1', name: 'Tenant helper', instructions: 'Help', core: false },
          'core-1': { id: 'core-1', name: 'Core helper', instructions: 'Help', core: true },
        },
        busy: { loading: false },
      },
    };

    // Act
    render(<Agents openAddAgent={true} setOpenAddAgent={setOpenAddAgent} />);

    // Assert
    expect(screen.getByTestId('tenant-table')).toBeInTheDocument();
    expect(screen.getByTestId('core-table')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('modal-save'));
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(typeof dispatch.mock.calls[1][0]).toBe('function');

    fireEvent.click(screen.getByTestId('delete-tenant-1'));
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('delete-modal-confirm'));
    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(typeof dispatch.mock.calls[2][0]).toBe('function');
  });
});
