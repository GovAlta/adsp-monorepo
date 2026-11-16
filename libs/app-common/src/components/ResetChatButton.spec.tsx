import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResetChatButton } from './ResetChatButton';

const TEST_ID = 'access-agent-new-chat';
const CLEAR_WARNING = 'Starting a new chat will clear your current conversation and messages.';
const REPLY_WARNING = 'The reply in progress will be discarded.';
const CONFIRM_QUESTION = 'This action cannot be undone. Do you want to continue?';

function click(container: HTMLElement, testId: string) {
  fireEvent(container.querySelector(`[testid="${testId}"]`) as Element, new CustomEvent('_click'));
}

function modal(container: HTMLElement) {
  return container.querySelector(`goa-modal[testid="${TEST_ID}-modal"]`);
}

function isModalOpen(container: HTMLElement): boolean {
  return modal(container)?.getAttribute('open') === 'true';
}

function modalMessage(container: HTMLElement): string | null | undefined {
  return modal(container)?.querySelector('p')?.textContent;
}

function renderButton(props: Partial<React.ComponentProps<typeof ResetChatButton>> = {}) {
  const onReset = jest.fn();
  const rendered = render(
    <ResetChatButton hasMessages awaitingReply={false} onReset={onReset} testId={TEST_ID} {...props} />,
  );
  return { ...rendered, onReset };
}

describe('ResetChatButton', () => {
  it('is disabled while there is nothing to clear', () => {
    // Arrange
    const { container } = renderButton({ hasMessages: false });

    // Assert
    expect(container.querySelector(`goa-button[testid="${TEST_ID}"]`)).toHaveAttribute('disabled', 'true');
  });

  it('asks for confirmation before starting a new chat', () => {
    // Arrange
    const { container, onReset } = renderButton();

    // Act
    click(container, TEST_ID);

    // Assert
    expect(isModalOpen(container)).toBe(true);
    expect(modalMessage(container)).toBe(`${CLEAR_WARNING} ${CONFIRM_QUESTION}`);
    expect(onReset).not.toHaveBeenCalled();
  });

  it('starts a new chat when the user confirms', () => {
    // Arrange
    const { container, onReset } = renderButton();
    click(container, TEST_ID);

    // Act
    click(container, `${TEST_ID}-confirm`);

    // Assert
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(isModalOpen(container)).toBe(false);
  });

  it('keeps the conversation when the user cancels', () => {
    // Arrange
    const { container, onReset } = renderButton();
    click(container, TEST_ID);

    // Act
    click(container, `${TEST_ID}-cancel`);

    // Assert
    expect(onReset).not.toHaveBeenCalled();
    expect(isModalOpen(container)).toBe(false);
  });

  it('keeps the conversation when the user closes the dialog without choosing', () => {
    // Arrange
    const { container, onReset } = renderButton();
    click(container, TEST_ID);

    // Act
    fireEvent(modal(container) as Element, new CustomEvent('_close'));

    // Assert
    expect(onReset).not.toHaveBeenCalled();
    expect(isModalOpen(container)).toBe(false);
  });

  it('stays available while a reply is in progress and warns that it will be discarded', () => {
    // Arrange
    const { container } = renderButton({ awaitingReply: true });

    // Act
    click(container, TEST_ID);

    // Assert
    expect(container.querySelector(`goa-button[testid="${TEST_ID}"]`)).not.toHaveAttribute('disabled', 'true');
    expect(modalMessage(container)).toBe(`${CLEAR_WARNING} ${REPLY_WARNING} ${CONFIRM_QUESTION}`);
  });

  it('says what starting over leaves alone before asking to continue', () => {
    // Arrange
    const { container } = renderButton({ keptContent: 'Your form isn’t changed.' });

    // Act
    click(container, TEST_ID);

    // Assert
    expect(modalMessage(container)).toBe(`${CLEAR_WARNING} Your form isn’t changed. ${CONFIRM_QUESTION}`);
  });

  it('shows the reload icon as a button', () => {
    // Arrange
    const { container } = renderButton();

    // Assert
    expect(container.querySelector(`goa-button[testid="${TEST_ID}"]`)).toHaveAttribute('leadingicon', 'reload');
  });

  it('leaves out the icon inline', () => {
    // Arrange
    const { container } = renderButton({ variant: 'inline' });

    // Assert
    expect(container.querySelector(`goa-button[testid="${TEST_ID}"]`)).not.toHaveAttribute('leadingicon');
  });
});
