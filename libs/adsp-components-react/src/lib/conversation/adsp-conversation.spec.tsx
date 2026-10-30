import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ADSPConversation } from './adsp-conversation';
import type { ReactNode } from 'react';

const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockLoadOlder = jest.fn();
const mockSend = jest.fn();
const mockUseConversation = jest.fn();
let adspConversationProps: { error?: string } = {};
let goaCalloutProps: { type?: string } = {};
let providerOverrides: unknown;

jest.mock('./useConversation', () => ({
  useConversation: (...args: unknown[]) => mockUseConversation(...args),
}));

jest.mock('../theme/adsp-theme-provider', () => ({
  AdspThemeProvider: ({ children, overrides }: { children: ReactNode; overrides?: unknown }) => {
    providerOverrides = overrides;
    return children;
  },
}));

jest.mock('./internal-adsp-conversation', () => ({
  InternalAdspConversation: ({
    onDelete,
    error,
  }: {
    onDelete?: (messageId: string | number) => void;
    error?: string;
  }) => {
    adspConversationProps = { error };

    return (
      <button type="button" onClick={() => onDelete?.(2)}>
        Trigger delete
      </button>
    );
  },
}));

jest.mock('@abgov/react-components', () => ({
  GoabModal: ({
    open,
    testId,
    children,
    actions,
    calloutVariant,
  }: {
    open: boolean;
    testId?: string;
    children: ReactNode;
    actions?: ReactNode;
    calloutVariant?: string;
  }) =>
    open ? (
      <section role="dialog" data-testid={testId} data-callout-variant={calloutVariant}>
        <div>{children}</div>
        <div>{actions}</div>
      </section>
    ) : null,
  GoabButtonGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  GoabButton: ({
    children,
    onClick,
    disabled,
    variant,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      <span data-variant={variant}>{children}</span>
    </button>
  ),
  GoabCallout: ({
    children,
    heading,
    testId,
    type,
  }: {
    children: ReactNode;
    heading?: string;
    testId?: string;
    type?: string;
  }) => {
    goaCalloutProps = { type };

    return (
      <section data-testid={testId}>
        {heading && <h2>{heading}</h2>}
        <div>{children}</div>
      </section>
    );
  },
}));

describe('ADSPConversation', () => {
  beforeEach(() => {
    mockRemove.mockClear();
    mockLoadOlder.mockClear();
    mockSend.mockClear();
    adspConversationProps = {};
    goaCalloutProps = {};
    providerOverrides = undefined;
    mockUseConversation.mockReturnValue({
      messages: [
        {
          id: 2,
          direction: 'received',
          sender: 'Reviewer',
          timestamp: '2026-01-02T10:01:00.000Z',
          content: 'Second message',
          canDelete: true,
        },
      ],
      loading: false,
      loadingOlder: false,
      error: undefined,
      canLoadOlder: false,
      loadOlder: mockLoadOlder,
      send: mockSend,
      remove: mockRemove,
    });
  });

  test('shows modal before deleting and confirms removal', async () => {
    render(<ADSPConversation client={{} as never} resourceId="resource-1" canDelete={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger delete' }));
    expect(screen.getByTestId('goa-conversation-delete-modal')).toBeInTheDocument();
    expect(screen.getByTestId('goa-conversation-delete-modal')).toHaveAttribute('data-callout-variant', 'emergency');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Delete$/ }));
    });

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByTestId('goa-conversation-delete-modal')).not.toBeInTheDocument());
  });

  test('can cancel delete modal without removing', () => {
    render(<ADSPConversation client={{} as never} resourceId="resource-1" canDelete={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockRemove).not.toHaveBeenCalled();
    expect(screen.queryByTestId('goa-conversation-delete-modal')).not.toBeInTheDocument();
  });

  test('shows load older button and triggers load older', () => {
    mockUseConversation.mockReturnValue({
      messages: [
        {
          id: 1,
          direction: 'received',
          sender: 'Reviewer',
          timestamp: '2026-01-02T10:00:00.000Z',
          content: 'First message',
          canDelete: true,
        },
      ],
      loading: false,
      loadingOlder: false,
      error: undefined,
      canLoadOlder: true,
      loadOlder: mockLoadOlder,
      send: mockSend,
      remove: mockRemove,
    });

    render(<ADSPConversation client={{} as never} resourceId="resource-1" canDelete={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load older messages' }));
    expect(mockLoadOlder).toHaveBeenCalledTimes(1);
  });

  test('hides load older button when there are no loaded messages', () => {
    mockUseConversation.mockReturnValue({
      messages: [],
      loading: false,
      loadingOlder: false,
      error: undefined,
      canLoadOlder: true,
      loadOlder: mockLoadOlder,
      send: mockSend,
      remove: mockRemove,
    });

    render(<ADSPConversation client={{} as never} resourceId="resource-1" canDelete={true} />);

    expect(screen.queryByRole('button', { name: 'Load older messages' })).not.toBeInTheDocument();
  });

  test('hides load older button when there is an error', () => {
    mockUseConversation.mockReturnValue({
      messages: [],
      loading: false,
      loadingOlder: false,
      error: 'failed',
      canLoadOlder: true,
      loadOlder: mockLoadOlder,
      send: mockSend,
      remove: mockRemove,
    });

    render(<ADSPConversation client={{} as never} resourceId="resource-1" canDelete={true} />);

    expect(screen.queryByRole('button', { name: 'Load older messages' })).not.toBeInTheDocument();
    expect(screen.getByTestId('goa-conversation-error')).toBeInTheDocument();
    expect(screen.getByText('Unable to load conversation')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(adspConversationProps.error).toBeUndefined();
    expect(goaCalloutProps.type).toBe('emergency');
  });

  test('shows loading label and disabled load older button', () => {
    mockUseConversation.mockReturnValue({
      messages: [
        {
          id: 1,
          direction: 'received',
          sender: 'Reviewer',
          timestamp: '2026-01-02T10:00:00.000Z',
          content: 'First message',
          canDelete: true,
        },
      ],
      loading: false,
      loadingOlder: true,
      error: undefined,
      canLoadOlder: true,
      loadOlder: mockLoadOlder,
      send: mockSend,
      remove: mockRemove,
    });

    render(<ADSPConversation client={{} as never} resourceId="resource-1" canDelete={true} />);

    expect(screen.getByRole('button', { name: 'Loading older messages...' })).toBeDisabled();
  });

  test('applies conversation theme overrides through AdspThemeProvider', () => {
    render(
      <ADSPConversation
        client={{} as never}
        resourceId="resource-1"
        themeOverrides={{ chatBoxFontSize: '1rem', chatBoxTextColor: '#111111', chatBoxBackground: '#f7f7f7' }}
      />,
    );

    expect(providerOverrides).toEqual({
      components: {
        conversation: {
          chatBoxFontSize: '1rem',
          chatBoxTextColor: '#111111',
          chatBoxBackground: '#f7f7f7',
        },
      },
    });
  });
});
