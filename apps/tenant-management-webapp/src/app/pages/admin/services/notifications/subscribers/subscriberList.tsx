import React, { FunctionComponent, useEffect } from 'react';
import type { Subscriber, SubscriberSort, SubscriberSortColumn } from '@store/subscription/models';
import { SUBSCRIBER_COLUMN_LABELS, SUBSCRIBER_SORT_COLUMNS } from '@store/subscription/models';
import { GoabBadge, GoabTable, GoabTableSortHeader } from '@abgov/react-components';
import { GoabTableOnSortDetail, GoabTableSortDirection } from '@abgov/ui-components-common';
import { phoneWrapper } from '@lib/wrappers';
import { hideDecorativeIcons } from '@lib/hideDecorativeIcons';
import styled from 'styled-components';
import { getChannelAddress, isVerified } from './recipient';

interface SubscriberListProps {
  subscribers: Subscriber[];
  selectedId: string;
  sort: SubscriberSort;
  onSelect: (subscriber: Subscriber) => void;
  onSort: (sort: SubscriberSort) => void;
}

// Shown where a recipient holds no address for a channel.
const EMPTY = '—';

const isSortColumn = (value: string): value is SubscriberSortColumn =>
  (SUBSCRIBER_SORT_COLUMNS as readonly string[]).includes(value);

export const SubscriberList: FunctionComponent<SubscriberListProps> = ({
  subscribers,
  selectedId,
  sort,
  onSelect,
  onSort,
}) => {
  const directionFor = (column: SubscriberSortColumn): GoabTableSortDirection =>
    sort.column === column ? sort.direction : 'none';

  const handleSort = ({ sortBy, sortDir }: GoabTableOnSortDetail) => {
    if (isSortColumn(sortBy)) {
      onSort({ column: sortBy, direction: sortDir < 0 ? 'desc' : 'asc' });
    }
  };

  // Each header's own text already names the column, so its sort-direction arrow is decorative.
  useEffect(() => hideDecorativeIcons('goa-table-sort-header'), []);

  return (
    <RegistryTable>
      <GoabTable width="100%" onSort={handleSort} testId="recipient-registry-table">
        <thead>
          <tr>
            {SUBSCRIBER_SORT_COLUMNS.map((column) => (
              <th key={column}>
                <GoabTableSortHeader name={column} direction={directionFor(column)}>
                  {SUBSCRIBER_COLUMN_LABELS[column]}
                </GoabTableSortHeader>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subscribers?.map((subscriber) => {
            const sms = getChannelAddress(subscriber, 'sms');
            return (
              <SelectableRow
                key={subscriber.id}
                className={subscriber.id === selectedId ? 'selected' : ''}
                data-testid={`recipient-row-${subscriber.id}`}
                // Clicking anywhere on the row selects it, as a convenience for a pointer. The
                // button in the name cell is what carries that to the keyboard and to assistive
                // technology, so that the row stays a row rather than being announced as a control.
                onClick={() => onSelect(subscriber)}
              >
                <td>
                  <SelectButton
                    type="button"
                    aria-pressed={subscriber.id === selectedId}
                    aria-label={subscriber.addressAs || getChannelAddress(subscriber, 'email') || 'Unnamed recipient'}
                    data-testid={`recipient-select-${subscriber.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(subscriber);
                    }}
                  >
                    {subscriber.addressAs}
                  </SelectButton>
                </td>
                <td>{getChannelAddress(subscriber, 'email') || EMPTY}</td>
                <td className="no-wrap">{sms ? phoneWrapper(sms) : EMPTY}</td>
                <td>
                  {isVerified(subscriber) ? (
                    <GoabBadge type="success" content="Verified" icon={false} />
                  ) : (
                    <GoabBadge type="important" content="Not verified" icon={false} />
                  )}
                </td>
              </SelectableRow>
            );
          })}
        </tbody>
      </GoabTable>
    </RegistryTable>
  );
};

const RegistryTable = styled.div`
  overflow-x: auto;

  td {
    word-break: break-word;
  }

  .no-wrap {
    white-space: nowrap;
  }
`;

const SelectableRow = styled.tr`
  cursor: pointer;

  &.selected {
    background-color: var(--goa-color-interactive-hover-background, #f1f1f1);
  }
`;

// Carries the row's selection to the keyboard while reading as the name that fills the cell.
const SelectButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;
