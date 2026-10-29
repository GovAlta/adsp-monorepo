import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import { AdspConversationExample } from './AdspConversationExample';
import { authenticatedUserSelector, directorySelector, getAccessToken } from '../../../state';
import { createConversationClient } from '@abgov/adsp-components-core';

const mockAdspConversation = jest.fn((props) => (
  <div data-testid="mock-adsp-conversation" data-resource-id={props.resourceId} />
));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../state', () => ({
  authenticatedUserSelector: jest.fn(),
  directorySelector: jest.fn(),
  getAccessToken: jest.fn(),
}));

jest.mock('@abgov/adsp-components-core', () => {
  const actual = jest.requireActual('@abgov/adsp-components-core');
  return {
    ...actual,
    createConversationClient: jest.fn(),
  };
});

jest.mock('@abgov/adsp-components-react', () => ({
  ADSPConversation: (props) => mockAdspConversation(props),
}));

describe('AdspConversationExample', () => {
  const commentServiceUrl = 'https://example-comment-service';

  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/');

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === directorySelector) {
        return { 'urn:ads:platform:comment-service': commentServiceUrl };
      }

      if (selector === authenticatedUserSelector) {
        return { id: 'user-123' };
      }

      return undefined;
    });

    (getAccessToken as jest.Mock).mockResolvedValue('token-abc');
    (createConversationClient as jest.Mock).mockReturnValue({ client: 'conversation-client' });
    global.fetch = jest.fn();
  });

  test('shows placeholder message before a topic type and topic are selected', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tenant: [], core: [] }),
    });

    // Act
    render(<AdspConversationExample />);

    // Assert
    expect(await screen.findByText('Select a topic type and topic to load a conversation.')).toBeInTheDocument();
    expect(mockAdspConversation).not.toHaveBeenCalled();
  });

  test('renders ADSPConversation when topic and resource are resolved from query and APIs', async () => {
    // Arrange
    window.history.replaceState({}, '', '/?typeId=type-1');

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tenant: [{ id: 'type-1', name: 'Type 1' }],
          core: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 'topic-1', resourceId: 'resource-1', name: 'Topic 1' }],
        }),
      });

    // Act
    render(<AdspConversationExample />);

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    const topicDropdown = document.querySelector('goa-dropdown[name="adsp-conversation-topic-id"]') as HTMLElement;
    fireEvent(topicDropdown, new CustomEvent('_change', { detail: { name: 'adsp-conversation-topic-id', value: 'topic-1' } }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('mock-adsp-conversation')).toBeInTheDocument();
    });

    const props = mockAdspConversation.mock.calls[0][0];
    expect(props.client).toEqual({ client: 'conversation-client' });
    expect(props.resourceId).toBe('resource-1');
    expect(props.typeId).toBe('type-1');
    expect(props.currentUserId).toBe('user-123');
    expect(props.canDelete).toBe(true);
    expect(props.themeOverrides).toEqual({
      chatBoxBackground: '#f3f7fb',
      chatBoxTextColor: '#102a43',
      chatBoxFontSize: '0.9375rem',
    });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/comment/v1/topic-types');
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('/comment/v1/topics');
  });

  test('shows an error when topic type load fails', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    // Act
    render(<AdspConversationExample />);

    // Assert
    expect(await screen.findByText('Unable to load topic types (500).')).toBeInTheDocument();
  });
});
