import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecipientDetails } from './recipientDetails';

describe('RecipientDetails', () => {
  const subscriber = {
    id: 'subscriber-1',
    addressAs: 'user-a',
    created: '2026-01-02T18:00:00.000Z',
    updated: '2026-02-03T18:00:00.000Z',
    channels: [
      { channel: 'email', address: 'tester@test.co', verified: true },
      { channel: 'sms', address: '7801234567', verified: true },
    ],
  };

  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    onEdit.mockReset();
    onDelete.mockReset();
    onClose.mockReset();
  });

  it('asks for a recipient to be selected when none is', () => {
    const { getByTestId, queryByTestId } = render(
      <RecipientDetails subscriber={null} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    expect(getByTestId('recipient-details-empty')).toBeTruthy();
    expect(queryByTestId('recipient-details')).toBeNull();
  });

  it('shows the contact information of the selected recipient', () => {
    const { getByTestId } = render(
      <RecipientDetails subscriber={subscriber} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    expect(getByTestId('recipient-details-name')).toHaveTextContent('user-a');
    expect(getByTestId('recipient-details-email')).toHaveTextContent('tester@test.co');
    expect(getByTestId('recipient-details-phone')).toHaveTextContent('780 123 4567');
  });

  it('shows the dates the recipient was created and last updated', () => {
    const { getByTestId } = render(
      <RecipientDetails subscriber={subscriber} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    expect(getByTestId('recipient-details-created')).toHaveTextContent('2026');
    expect(getByTestId('recipient-details-updated')).toHaveTextContent('2026');
  });

  it('shows a dash for contact information the recipient does not have', () => {
    const { getByTestId } = render(
      <RecipientDetails
        subscriber={{ id: 'subscriber-2', addressAs: 'user-b', channels: [] }}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    expect(getByTestId('recipient-details-email')).toHaveTextContent('—');
    expect(getByTestId('recipient-details-phone')).toHaveTextContent('—');
    expect(getByTestId('recipient-details-created')).toHaveTextContent('—');
  });

  it('edits and deletes the recipient it is showing', () => {
    const { baseElement } = render(
      <RecipientDetails subscriber={subscriber} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    fireEvent(
      baseElement.querySelector("goa-icon-button[testId='recipient-details-edit-subscriber-1']"),
      new CustomEvent('_click'),
    );
    expect(onEdit).toHaveBeenCalledWith(subscriber);

    fireEvent(
      baseElement.querySelector("goa-icon-button[testId='recipient-details-delete']"),
      new CustomEvent('_click'),
    );
    expect(onDelete).toHaveBeenCalledWith(subscriber);
  });

  it('shows the verification status as a badge of its own', () => {
    const { baseElement } = render(
      <RecipientDetails subscriber={subscriber} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    const badge = baseElement.querySelector("[data-testid='recipient-details-verification'] goa-badge");
    expect(badge).toHaveAttribute('content', 'Verified');
  });

  it('shows a recipient with an unverified address as not verified', () => {
    const { baseElement } = render(
      <RecipientDetails
        subscriber={{
          ...subscriber,
          channels: [{ channel: 'email', address: 'tester@test.co', verified: false }],
        }}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    const badge = baseElement.querySelector("[data-testid='recipient-details-verification'] goa-badge");
    expect(badge).toHaveAttribute('content', 'Not verified');
  });

  it('shows the name the recipient is addressed as', () => {
    const { getByTestId } = render(
      <RecipientDetails subscriber={subscriber} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    expect(getByTestId('recipient-details-address-as')).toHaveTextContent('user-a');
  });

  it('closes the pane', () => {
    const { baseElement } = render(
      <RecipientDetails subscriber={subscriber} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    fireEvent(
      baseElement.querySelector("goa-icon-button[testId='recipient-details-close']"),
      new CustomEvent('_click'),
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('shows a count and the names of the subscriptions the recipient holds', () => {
    const { getByTestId, getByText } = render(
      <RecipientDetails
        subscriber={subscriber}
        subscriptions={[
          { typeId: 'status-updates', type: { id: 'status-updates', name: 'Application Status Update' } },
          { typeId: 'health-check', type: { id: 'health-check', name: 'Application Health Check Change' } },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    expect(getByText('Subscriptions (2)')).toBeTruthy();
    expect(getByText('Application Status Update')).toBeTruthy();
    expect(getByText('Application Health Check Change')).toBeTruthy();
    expect(getByTestId('recipient-details-subscriptions')).toBeTruthy();
  });

  it('falls back to the type id when a subscription type has no name', () => {
    const { getByText } = render(
      <RecipientDetails
        subscriber={subscriber}
        subscriptions={[{ typeId: 'form-status-updates' }]}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    expect(getByText('form-status-updates')).toBeTruthy();
  });

  it('shows loading text before the subscriptions have been fetched', () => {
    const { getByTestId } = render(
      <RecipientDetails subscriber={subscriber} subscriptions={undefined} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    expect(getByTestId('recipient-details-subscriptions-empty')).toHaveTextContent('Loading subscriptions...');
  });

  it('shows a count of zero once loaded with no subscriptions held', () => {
    const { getByText, getByTestId } = render(
      <RecipientDetails subscriber={subscriber} subscriptions={[]} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );

    expect(getByText('Subscriptions (0)')).toBeTruthy();
    expect(getByTestId('recipient-details-subscriptions-empty')).toHaveTextContent('No subscriptions');
  });

  it('only offers the account link for a recipient that has one', () => {
    const { baseElement, rerender } = render(
      <RecipientDetails subscriber={subscriber} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />,
    );
    expect(baseElement.querySelector("goa-icon-button[testId='recipient-details-account-link']")).toBeNull();

    rerender(
      <RecipientDetails
        subscriber={{ ...subscriber, accountLink: 'https://account.example.co/user-a' }}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );
    expect(baseElement.querySelector("goa-icon-button[testId='recipient-details-account-link']")).toBeTruthy();
  });
});
