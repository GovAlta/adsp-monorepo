import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationStatusBar } from './ConversationStatusBar';
import { AgentUsage, ConversationStatus } from '../types/agent';

const usage: AgentUsage = {
  contextTokens: 14281,
  contextWindowTokens: 256000,
  totalTokens: 28260,
  outputTokens: 1400,
  modelCalls: 2,
};

const context = { contextTokens: 14281, contextWindowTokens: 256000 };
const okStatus: ConversationStatus = { ...context, state: 'ok' };
const noticeStatus: ConversationStatus = { ...context, state: 'notice', reason: 'summarised' };
const warningStatus: ConversationStatus = {
  ...context,
  contextTokens: 180200,
  state: 'warning',
  reason: 'near-context-limit',
};

function bar(container: HTMLElement) {
  return container.querySelector('[data-testid="conversation-status"]') as HTMLElement;
}

// The visible line as a wide pane shows it: the short labels are hidden there, and so is the screen reader text.
function wideText(container: HTMLElement): string {
  const summary = (bar(container).querySelector('.summary') as HTMLElement).cloneNode(true) as HTMLElement;
  summary.querySelectorAll('.visually-hidden, .short-label').forEach((element) => element.remove());
  return (summary.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// What a narrow pane keeps: everything except the details and the long labels.
function narrowText(container: HTMLElement): string {
  const summary = (bar(container).querySelector('.summary') as HTMLElement).cloneNode(true) as HTMLElement;
  summary.querySelectorAll('.visually-hidden, .detail, .long-label').forEach((element) => element.remove());
  return (summary.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function tooltip(container: HTMLElement) {
  return container.querySelector('goa-tooltip')?.getAttribute('content');
}

describe('ConversationStatusBar', () => {
  it('says there are no messages yet before the first reply', () => {
    // Act
    const { container } = render(<ConversationStatusBar />);

    // Assert
    expect(wideText(container)).toBe('Context: no messages yet');
  });

  it('leads with the context used, to one decimal, and what the last answer used', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={okStatus} usage={usage} />);

    // Assert
    expect(wideText(container)).toBe('Context 14.3k of 256k · Last answer about 28k tokens');
  });

  it('keeps only the context used in a narrow pane', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={okStatus} usage={usage} />);

    // Assert
    expect(narrowText(container)).toBe('Context 14.3k');
  });

  it('puts the percentage and full details in the tooltip', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={okStatus} usage={usage} />);

    // Assert
    expect(tooltip(container)).toBe(
      'Context: 14.3k of 256k tokens (6%). Last answer: about 28k tokens across 2 model calls.',
    );
  });

  it('adds a neutral notice once earlier messages are summarised, keeping the context visible', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={noticeStatus} usage={usage} />);

    // Assert
    expect(bar(container)).toHaveAttribute('data-state', 'notice');
    expect(wideText(container)).toBe('Context 14.3k of 256k · Earlier messages summarised');
  });

  it('shortens the notice in a narrow pane', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={noticeStatus} usage={usage} />);

    // Assert
    expect(narrowText(container)).toBe('Context 14.3k · Summarised');
  });

  it('explains the notice in the tooltip', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={noticeStatus} usage={usage} />);

    // Assert
    expect(tooltip(container)).toMatch(
      /^Earlier messages summarised\. Details from early in the chat may be missed\. Context:/,
    );
  });

  it('leads with a warning close to the assistant’s limit, keeping the context visible', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={warningStatus} usage={usage} />);

    // Assert
    expect(bar(container)).toHaveAttribute('data-state', 'warning');
    expect(wideText(container)).toBe('Close to the assistant’s limit · Context 180.2k of 256k');
  });

  it('shortens the warning in a narrow pane', () => {
    // Act
    const { container } = render(<ConversationStatusBar status={warningStatus} usage={usage} />);

    // Assert
    expect(narrowText(container)).toBe('Near limit · Context 180.2k');
  });

  it('shows the action it is given', () => {
    // Act
    const { getByRole } = render(
      <ConversationStatusBar status={okStatus} action={<button type="button">Reset chat</button>} />,
    );

    // Assert
    expect(getByRole('button', { name: 'Reset chat' })).toBeInTheDocument();
  });
});
