import React, { FunctionComponent, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { Subscriber, Subscription, SubscriptionSearchCriteria, Criteria } from '@store/subscription/models';
import { UpdateSubscriber, GetTypeSubscriptions } from '@store/subscription/actions';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { SubscriberModalForm } from './editSubscriber';
import { GoAIcon, GoAIconButton } from '@abgov/react-components/experimental';
import { SubscriptionNextLoader } from './subscriptionNextLoader';
import { GoAContextMenuIcon } from '@components/ContextMenu';

interface SubscriptionProps {
  subscriber: Subscriber;
  criteria: Criteria;
  typeId: string;
  readonly?: boolean;
  openModal?: (subscription: Subscription) => void;
  onDelete: (subscription: Subscriber, type: string) => void;
}

const SubscriptionComponent: FunctionComponent<SubscriptionProps> = ({ subscriber, criteria, onDelete, typeId }) => {
  function characterLimit(string, limit) {
    if (string?.length > limit) {
      const slicedString = string.slice(0, limit);
      return slicedString + '...';
    } else {
      return string;
    }
  }

  const displayOrder = ['email', 'sms', 'bot'];
  const sortedChannels = [];
  displayOrder.forEach((display) => {
    const ix = subscriber.channels.findIndex((channel) => channel.channel === display);
    if (ix !== -1) {
      sortedChannels.push(subscriber.channels[ix]);
    }
  });

  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td headers="userName" data-testid="addressAs">
          {characterLimit(subscriber?.addressAs, 30)}
        </td>
        <td headers="channels" data-testid="channels">
          {sortedChannels.map((channel, i) => (
            <div key={`channels-id-${i}`} style={{ display: 'flex' }}>
              <div>
                <div>
                  {channel.channel === 'email' ? (
                    <IconsCell>
                      <GoAIcon data-testid="mail-icon" size="medium" type="mail" />
                    </IconsCell>
                  ) : channel.channel === 'sms' ? (
                    <IconsCell>
                      <GoAIcon data-testid="sms-icon" size="medium" type="phone-portrait" />
                    </IconsCell>
                  ) : (
                    `${channel.channel}:`
                  )}{' '}
                </div>
              </div>
              <div>{characterLimit(channel?.address, 30)}</div>
            </div>
          ))}
        </td>
        <td headers="actions" data-testid="actions">
          <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
            <GoAIconButton
              data-testid={`delete-subscription-${subscriber.id}`}
              size="medium"
              type="trash"
              onClick={() => onDelete(subscriber, typeId)}
            />
            {criteria && (criteria.correlationId || criteria.context) && (
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                onClick={() => {
                  setShowDetails(!showDetails);
                }}
                testId="toggle-details-visibility"
              />
            )}
          </div>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" colSpan={3}>
            <div data-testid="subscriber-criteria">{JSON.stringify(criteria, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};

interface SubscriptionsListComponentProps {
  className?: string;
  onDelete: (subscription: Subscriber, type: string) => void;
  searchCriteria: SubscriptionSearchCriteria;
}

const typeSubscriptionsSelector = createSelector(
  (state: RootState) => state.subscription.typeSubscriptionSearch,
  (state: RootState) => state.notification.notificationTypes,
  (state: RootState) => state.notification.core,
  (state: RootState) => state.subscription.subscriptions,
  (state: RootState) => state.subscription.subscribers,
  (typeSearch, types, coreTypes, subscriptions, subscribers) => {
    const typeSubscriptions = Object.entries(typeSearch)
      .filter(([_typeId, { results }]) => !!results.length)
      .reduce(
        (typeSubs, [typeId, { results }]) => ({
          ...typeSubs,
          [typeId]: results
            .filter((result) => subscriptions[`${typeId}:${result}`])
            .map((result) => ({
              ...subscriptions[`${typeId}:${result}`],
              subscriber: subscribers[result],
            })),
        }),
        {}
      );

    const groups = Object.keys(typeSubscriptions)
      .map((typeId) => coreTypes[typeId] || types[typeId])
      .sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });

    return { groups, typeSubscriptions };
  }
);

const SubscriptionsListComponent: FunctionComponent<SubscriptionsListComponentProps> = ({
  className,
  onDelete,
  searchCriteria,
}) => {
  const dispatch = useDispatch();
  const { groups, typeSubscriptions } = useSelector(typeSubscriptionsSelector);
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const openModalFunction = (subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscription(true);
  };

  function reset() {
    setEditSubscription(false);
  }

  if (!groups) {
    return (
      <div>
        {' '}
        <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
      </div>
    );
  }

  const searchFn = ({ type, searchCriteria }) => {
    dispatch(GetTypeSubscriptions(type, searchCriteria, searchCriteria.next));
  };

  return (
    <div className={className}>
      {groups.map((type, index) => (
        <div key={type.id}>
          <div className="group-name">{type.name}</div>
          <DataTable data-testid={`subscription-table-${index}`}>
            <thead>
              <tr>
                <th className="address-as" id="userName" data-testid={`subscription-header-address-as-${index}`}>
                  Address as
                </th>
                <th id="channels">Channels</th>
                <th id="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {typeSubscriptions[type.id].map((subscription) => (
                <SubscriptionComponent
                  key={`${subscription.subscriber.id}`}
                  subscriber={subscription.subscriber}
                  criteria={subscription.criteria}
                  openModal={openModalFunction}
                  typeId={subscription.typeId}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </DataTable>
          <SubscriptionNextLoader onSearch={searchFn} type={type.id} searchCriteria={searchCriteria} />
        </div>
      ))}
      {/* Form */}
      <SubscriberModalForm
        open={editSubscription}
        initialValue={selectedSubscription}
        // errors={errors}
        onSave={(subscriber) => {
          dispatch(UpdateSubscriber(subscriber));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
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

  & .address-as {
    min-width: 180px;
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

const IconsCell = styled.div`
  display: flex;
  justify-content: space-around;
  width: 90%;
  width: 50%;
  margin: 5px 3px 0 0;
`;
