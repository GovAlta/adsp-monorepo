import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';

import { WebhookActionModals, WebhookListTable } from './webhooks';
import {
  AddEditStatusWebhookType,
  DeleteStatusWebhookType,
  StatusWebhookHistoryType,
  TestStatusWebhookType,
} from '@store/status/models';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('@components/DataTable', () => ({
  __esModule: true,
  default: ({ children, ...props }) => <table {...props}>{children}</table>,
}));

jest.mock('@components/ContextMenu', () => ({
  GoAContextMenu: ({ children }) => <div>{children}</div>,
  GoAContextMenuIcon: ({ title, onClick, testId }) => (
    <button type="button" title={title} data-testid={testId} onClick={onClick}>
      {title}
    </button>
  ),
}));

jest.mock('./webhookHistoryForm', () => ({
  WebhookHistoryModal: () => <div data-testid="webhook-history-modal" />,
}));

jest.mock('./testWebhook', () => ({
  TestWebhookModal: () => <div data-testid="webhook-test-modal" />,
}));

jest.mock('./webhookDeleteModal', () => ({
  WebhookDeleteModal: () => <div data-testid="webhook-delete-modal" />,
}));

jest.mock('@components/NoItem', () => ({
  renderNoItem: (itemName: string) => <div>{`No ${itemName} found`}</div>,
}));

describe('WebhookListTable', () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        session: {
          indicator: { show: false },
        },
      }),
    );
  });

  const webhooks = {
    'webhook-1': {
      id: 'webhook-1',
      name: 'Status webhook',
      url: 'https://example.com/this-is-a-very-long-webhook-url',
      description: 'Monitors the status service',
      intervalMinutes: 15,
      targetId: 'target-1',
      eventTypes: [],
    },
  };

  it('renders an empty state when there are no webhooks', () => {
    render(<WebhookListTable webhooks={{}} />);

    expect(screen.getByText('No webhooks found')).toBeInTheDocument();
  });

  it('renders each webhook row with its details', () => {
    render(<WebhookListTable webhooks={webhooks} />);

    expect(screen.getByText('Status webhook')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByTestId('webhook-details-webhook-1')).toBeInTheDocument();
  });

  it('toggles the description when the details button is clicked', () => {
    render(<WebhookListTable webhooks={webhooks} />);

    expect(screen.queryByText('Monitors the status service')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('webhook-details-webhook-1'));

    expect(screen.getByText('Monitors the status service')).toBeInTheDocument();
  });

  it('dispatches the history modal state when the history action is clicked', () => {
    render(<WebhookListTable webhooks={webhooks} />);

    fireEvent.click(screen.getAllByTestId('webhook-test-webhook-1')[0]);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session/modal/update',
        payload: expect.objectContaining({
          type: StatusWebhookHistoryType,
          isOpen: true,
          id: 'webhook-1',
        }),
      }),
    );
  });

  it('dispatches the test, edit, and delete modal states for the selected webhook', () => {
    render(<WebhookListTable webhooks={webhooks} />);

    fireEvent.click(screen.getAllByTestId('webhook-test-webhook-1')[1]);
    fireEvent.click(screen.getByTestId('webhook-edit-webhook-1'));
    fireEvent.click(screen.getByTestId('webhook-delete-webhook-1'));

    expect(dispatch.mock.calls).toContainEqual([
      expect.objectContaining({
        type: 'session/modal/update',
        payload: expect.objectContaining({
          type: TestStatusWebhookType,
          isOpen: true,
          id: 'webhook-1',
        }),
      }),
    ]);
    expect(dispatch.mock.calls).toContainEqual([
      expect.objectContaining({
        type: 'session/modal/update',
        payload: expect.objectContaining({
          type: AddEditStatusWebhookType,
          isOpen: true,
          id: 'webhook-1',
        }),
      }),
    ]);
    expect(dispatch.mock.calls).toContainEqual([
      expect.objectContaining({
        type: 'session/modal/update',
        payload: expect.objectContaining({
          type: DeleteStatusWebhookType,
          isOpen: true,
          id: 'webhook-1',
        }),
      }),
    ]);
  });
});

describe('WebhookActionModals', () => {
  it('renders the modal containers', () => {
    render(<WebhookActionModals />);

    expect(screen.getByTestId('webhook-history-modal')).toBeInTheDocument();
    expect(screen.getByTestId('webhook-test-modal')).toBeInTheDocument();
    expect(screen.getByTestId('webhook-delete-modal')).toBeInTheDocument();
  });
});
