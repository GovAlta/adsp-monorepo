import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NewChatButton } from './NewChatButton';

function click(container: HTMLElement, testId: string) {
  fireEvent(container.querySelector(`[testid="${testId}"]`) as Element, new CustomEvent('_click'));
}

function modal(container: HTMLElement) {
  return container.querySelector('goa-modal[testid="access-agent-new-chat-modal"]');
}

function isModalOpen(container: HTMLElement): boolean {
  return modal(container)?.getAttribute('open') === 'true';
}

describe('NewChatButton', () => {
  it('is disabled while there is nothing to clear', () => {
    const { container } = render(<NewChatButton hasMessages={false} awaitingReply={false} onNewChat={jest.fn()} />);

    expect(container.querySelector('goa-button[testid="access-agent-new-chat"]')).toHaveAttribute('disabled', 'true');
  });

  it('asks for confirmation before starting a new chat', () => {
    const onNewChat = jest.fn();
    const { container } = render(<NewChatButton hasMessages awaitingReply={false} onNewChat={onNewChat} />);

    expect(isModalOpen(container)).toBe(false);
    click(container, 'access-agent-new-chat');

    expect(isModalOpen(container)).toBe(true);
    expect(modal(container)).toHaveTextContent('The current conversation will be cleared');
    expect(modal(container)).not.toHaveTextContent('The reply in progress will be discarded.');
    expect(onNewChat).not.toHaveBeenCalled();

    click(container, 'access-agent-new-chat-confirm');

    expect(onNewChat).toHaveBeenCalledTimes(1);
    expect(isModalOpen(container)).toBe(false);
  });

  it('keeps the conversation when the user cancels', () => {
    const onNewChat = jest.fn();
    const { container } = render(<NewChatButton hasMessages awaitingReply={false} onNewChat={onNewChat} />);

    click(container, 'access-agent-new-chat');
    click(container, 'access-agent-new-chat-cancel');

    expect(onNewChat).not.toHaveBeenCalled();
    expect(isModalOpen(container)).toBe(false);
  });

  it('stays available while a reply is in progress and warns that it will be discarded', () => {
    const { container } = render(<NewChatButton hasMessages awaitingReply onNewChat={jest.fn()} />);

    expect(container.querySelector('goa-button[testid="access-agent-new-chat"]')).not.toHaveAttribute(
      'disabled',
      'true',
    );
    click(container, 'access-agent-new-chat');

    expect(modal(container)).toHaveTextContent('The reply in progress will be discarded.');
  });
});
