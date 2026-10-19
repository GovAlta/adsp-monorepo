import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ConfirmDelete } from './ConfirmDelete';

describe('ConfirmDelete', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  const renderModal = (props: Partial<React.ComponentProps<typeof ConfirmDelete>> = {}) =>
    render(
      <ConfirmDelete
        open
        heading="Delete this thing?"
        testIdPrefix="thing-delete"
        onCancel={onCancel}
        onConfirm={onConfirm}
        {...props}
      >
        <strong>Thing</strong> will be removed.
      </ConfirmDelete>,
    ).container;
  const button = (container: HTMLElement, testId: string) =>
    container.querySelector(`goa-button[testid="${testId}"]`) as Element;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the heading, content and a Delete button', () => {
    const container = renderModal();

    const modal = container.querySelector('goa-modal[testid="thing-delete-modal"]');
    expect(modal?.getAttribute('heading')).toBe('Delete this thing?');
    expect(modal?.getAttribute('open')).toBe('true');
    expect(modal?.textContent).toContain('Thing will be removed.');
    expect(button(container, 'thing-delete-confirm').textContent).toBe('Delete');
  });

  it('uses the confirm label and modal test id when given', () => {
    const container = renderModal({ confirmLabel: 'Revert', modalTestId: 'custom-modal' });

    expect(container.querySelector('goa-modal[testid="custom-modal"]')).not.toBeNull();
    expect(button(container, 'thing-delete-confirm').textContent).toBe('Revert');
  });

  it('confirms, cancels and closes through the callbacks', () => {
    const container = renderModal();

    fireEvent(button(container, 'thing-delete-confirm'), new CustomEvent('_click'));
    fireEvent(button(container, 'thing-delete-cancel'), new CustomEvent('_click'));
    fireEvent(container.querySelector('goa-modal') as Element, new CustomEvent('_close'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('disables both buttons while busy', () => {
    const container = renderModal({ busy: true });

    expect(button(container, 'thing-delete-cancel').getAttribute('disabled')).toBe('true');
    expect(button(container, 'thing-delete-confirm').getAttribute('disabled')).toBe('true');
  });
});
