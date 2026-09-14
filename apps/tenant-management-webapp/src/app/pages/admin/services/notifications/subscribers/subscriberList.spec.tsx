import React from 'react';
import { fireEvent, render, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SubscriberList } from './subscriberList';
import { DEFAULT_SUBSCRIBER_SORT } from '@store/subscription/models';

describe('SubscriberList', () => {
  const subscribers = [
    {
      id: 'a',
      addressAs: 'user-a',
      channels: [
        { channel: 'email', address: 'a@test.co', verified: true },
        { channel: 'sms', address: '7801234567', verified: true },
      ],
    },
    {
      id: 'b',
      addressAs: 'user-b',
      channels: [{ channel: 'email', address: 'b@test.co', verified: false }],
    },
  ];

  const onSelect = jest.fn();
  const onSort = jest.fn();

  beforeEach(() => {
    onSelect.mockReset();
    onSort.mockReset();
  });

  const renderList = (props = {}) =>
    render(
      <SubscriberList
        subscribers={subscribers}
        selectedId={null}
        sort={DEFAULT_SUBSCRIBER_SORT}
        onSelect={onSelect}
        onSort={onSort}
        {...props}
      />,
    );

  it('shows the contact information of each recipient', () => {
    const { getByTestId } = renderList();

    const row = within(getByTestId('recipient-row-a'));
    expect(row.getByText('user-a')).toBeTruthy();
    expect(row.getByText('a@test.co')).toBeTruthy();
    expect(row.getByText('780 123 4567')).toBeTruthy();
  });

  it('shows a dash where a recipient has no address for a channel', () => {
    const { getByTestId } = renderList();

    expect(within(getByTestId('recipient-row-b')).getByText('—')).toBeTruthy();
  });

  it('selects a recipient when the row is clicked', () => {
    const { getByTestId } = renderList();

    fireEvent.click(getByTestId('recipient-row-b'));

    expect(onSelect).toHaveBeenCalledWith(subscribers[1]);
  });

  // The row is selectable with a pointer, but the button in the name cell is what carries that
  // to the keyboard and to assistive technology.
  it('selects a recipient from the button in the name cell', () => {
    const { getByTestId } = renderList();

    const selectButton = getByTestId('recipient-select-a');
    expect(selectButton.tagName).toBe('BUTTON');

    fireEvent.click(selectButton);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(subscribers[0]);
  });

  it('marks the selected recipient', () => {
    const { getByTestId } = renderList({ selectedId: 'a' });

    expect(getByTestId('recipient-select-a')).toHaveAttribute('aria-pressed', 'true');
    expect(getByTestId('recipient-select-b')).toHaveAttribute('aria-pressed', 'false');
  });

  it('heads the name column with what it holds', () => {
    const { baseElement } = renderList();

    expect(baseElement.querySelector("goa-table-sort-header[name='name']")).toHaveTextContent('Name / Address as');
  });

  it('shows which column the results are sorted on', () => {
    const { baseElement } = renderList({ sort: { column: 'email', direction: 'desc' } });

    expect(baseElement.querySelector("goa-table-sort-header[name='email']")).toHaveAttribute('direction', 'desc');
    expect(baseElement.querySelector("goa-table-sort-header[name='name']")).toHaveAttribute('direction', 'none');
  });

  it('sorts on the column whose heading was chosen', () => {
    const { baseElement } = renderList();
    const table = baseElement.querySelector("goa-table[testId='recipient-registry-table']");

    fireEvent(table, new CustomEvent('_sort', { detail: { sortBy: 'email', sortDir: 1 } }));
    expect(onSort).toHaveBeenCalledWith({ column: 'email', direction: 'asc' });

    fireEvent(table, new CustomEvent('_sort', { detail: { sortBy: 'verified', sortDir: -1 } }));
    expect(onSort).toHaveBeenCalledWith({ column: 'verified', direction: 'desc' });
  });

  it('ignores a sort on something that is not one of the columns', () => {
    const { baseElement } = renderList();
    const table = baseElement.querySelector("goa-table[testId='recipient-registry-table']");

    fireEvent(table, new CustomEvent('_sort', { detail: { sortBy: 'nonsense', sortDir: 1 } }));

    expect(onSort).not.toHaveBeenCalled();
  });

  it('renders nothing for a result set that has not arrived', () => {
    const { queryByTestId } = renderList({ subscribers: null });

    expect(queryByTestId('recipient-row-a')).toBeNull();
  });
});
