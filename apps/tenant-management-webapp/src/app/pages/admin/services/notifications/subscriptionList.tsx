import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { Subscriber } from '@store/subscription/models';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { GoAIcon } from '@abgov/react-components/experimental';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
interface SubscriptionProps {
  subscription: Subscriber;
  type: string;
  readonly?: boolean;
  onDelete: (subscription: Subscriber, type: string) => void;
}

const SubscriptionComponent: FunctionComponent<SubscriptionProps> = ({ subscription, type, onDelete }) => {
  return (
    <>
      <tr>
        <td headers="userName" data-testid="addressAs">
          {subscription?.addressAs}
        </td>
        <td headers="channels" data-testid="channels">
          {subscription?.channels.map((channel, i) => (
            <div key={`channels-id-${i}`} style={{ display: 'flex' }}>
              <div>
                <b>
                  {channel.channel === 'email' ? (
                    <IconsCell>
                      <GoAIcon data-testid="mail-icon" size="medium" type="mail" />
                    </IconsCell>
                  ) : (
                    `${channel.channel}:`
                  )}{' '}
                </b>
              </div>
              <div>{channel.address}</div>
            </div>
          ))}
        </td>
        <td headers="actions" data-testid="actions">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type="trash"
              onClick={() => onDelete(subscription, type)}
              testId="delete-subscription"
            />
          </GoAContextMenu>
        </td>
      </tr>
    </>
  );
};

interface SubscriptionsListComponentProps {
  className?: string;
  onDelete: (subscription: Subscriber, type: string) => void;
}

const SubscriptionsListComponent: FunctionComponent<SubscriptionsListComponentProps> = ({ className, onDelete }) => {
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
  const orderedGroupNames = Object.keys(groupedSubscriptions).sort((prev, next): number => {
    if (prev > next) {
      return 1;
    }
    return -1;
  });

  return (
    <div className={className}>
      {orderedGroupNames.map((group, index) => (
        <div key={group}>
          <div className="group-name">{group}</div>
          <DataTable data-testid={`subscription-table-${index}`}>
            <thead>
              <tr>
                <th id="userName" data-testid={`subscription-header-address-as-${index}`}>
                  User name
                </th>
                <th id="channels">Channels</th>
                <th id="action">Action</th>
              </tr>
            </thead>
            <tbody>
              {groupedSubscriptions[group].map((subscription) => (
                <SubscriptionComponent
                  key={`${subscription?.subscriber?.id}:${subscription?.subscriber?.urn}:${Math.random()}`}
                  subscription={subscription?.subscriber}
                  type={subscription?.typeId}
                  onDelete={onDelete}
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

const IconsCell = styled.td`
  display: flex;
  justify-content: space-around;
  width: 90%;
  width: 50%;
`;
