import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { Subscription, Subscriber } from '@store/subscription/models';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';

import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface SubscriptionProps {
  subscription: Subscriber;
  readonly?: boolean;
}

const SubscriptionComponent: FunctionComponent<SubscriptionProps> = ({ subscription }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td headers="name" data-testid="name">
          {subscription?.addressAs}
        </td>
        <td headers="description" data-testid="description">
          {subscription?.userId}
        </td>
        <td headers="actions" data-testid="actions">
          {/* <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
          </GoAContextMenu> */}
        </td>
      </tr>
      {showDetails && (
        <tr>
          {/* <td className="payload-details" headers="namespace name description payload" colSpan={5}>
            <div data-testid="details">{JSON.stringify(subscription.payloadSchema, null, 2)}</div>
          </td> */}
        </tr>
      )}
    </>
  );
};

interface SubscriptionsListComponentProps {
  className?: string;
}

const SubscriptionsListComponent: FunctionComponent<SubscriptionsListComponentProps> = ({ className }) => {
  const subscriptions = useSelector((state: RootState) => state.subscription.subscriptions);

  if (!subscriptions) {
    return (
      <div>
        {' '}
        <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
      </div>
    );
  }

  const groupedSubscriptions = subscriptions.reduce((acc, def) => {
    acc[def.typeId] = acc[def.typeId] || [];
    acc[def.typeId].push(def);
    return acc;
  }, {});

  console.log(JSON.stringify(groupedSubscriptions) + '<groupedSubscriptions');
  const orderedGroupNames = Object.keys(groupedSubscriptions).sort((prev, next): number => {
    // Each group must have at least one element
    if (prev > next) {
      return 1;
    }
    return -1;
  });

  // [group]
  //               .sort((prev, next): number => {
  //                 // in each group sort by alphabetic order
  //                 if (prev.name > next.name) {
  //                   return 1;
  //                 }
  //                 return -1;
  //               })
  //   return <div>xxx</div>;
  // };
  return (
    <div className={className}>
      {orderedGroupNames.map((group) => (
        <div key={group}>
          <div className="group-name">{group}</div>
          <DataTable data-testid="events-definitions-table">
            <thead data-testid="events-definitions-table-header">
              <tr>
                <th id="name" data-testid="events-definitions-table-header-name">
                  Name
                </th>
                <th id="description">Description</th>
                <th id="actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {groupedSubscriptions[group].map((subscription) => (
                <SubscriptionComponent
                  key={`${subscription?.subscriber?.id}:${subscription?.subscriber?.urn}:${Math.random()}`}
                  subscription={subscription?.subscriber}
                />
              ))}
            </tbody>
          </DataTable>
        </div>
      ))}
    </div>
  );
};

export const SubscriptionList = styled(SubscriptionsListComponent)`
  display: flex-inline-table;
  & .group-name {
    text-transform: capitalize;
    font-size: var(--fs-lg);
    font-weight: var(--fw-bold);
  }

  & td:first-child {
    width: 100px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & .payload-details {
    div {
      background: #f3f3f3;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      line-height: 16px;
      padding: 16px;
    }
    padding: 0;
  }

  table {
    margin-bottom: 2rem;
  }
`;
