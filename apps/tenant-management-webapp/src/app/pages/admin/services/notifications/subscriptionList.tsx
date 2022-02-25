import React, { FunctionComponent, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { Subscriber, Subscription, SubscriptionSearchCriteria } from '@store/subscription/models';
import { UpdateSubscriberService, getTypeSubscriptions } from '@store/subscription/actions';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { SubscriberModalForm } from './editSubscriber';
import { GoAIcon } from '@abgov/react-components/experimental';
import { SubscriptionNextLoader } from './subscriptionNextLoader';
import { renderNoItem } from '@components/NoItem';
interface SubscriptionProps {
  subscription: Subscriber;
  type: string;
  readonly?: boolean;
  openModal?: (subscription: Subscription) => void;
  onDelete: (subscription: Subscriber, type: string) => void;
}

const SubscriptionComponent: FunctionComponent<SubscriptionProps> = ({ subscription, openModal, onDelete, type }) => {
  function characterLimit(string, limit) {
    if (string?.length > limit) {
      const slicedString = string.slice(0, limit);
      return slicedString + '...';
    } else {
      return string;
    }
  }

  return (
    <tr>
      <td headers="userName" data-testid="addressAs">
        {characterLimit(subscription?.addressAs, 30)}
      </td>
      <td headers="channels" data-testid="channels">
        {subscription?.channels.map((channel, i) => (
          <div key={`channels-id-${i}`} style={{ display: 'flex' }}>
            <div>
              <div>
                {channel.channel === 'email' ? (
                  <IconsCell>
                    <GoAIcon data-testid="mail-icon" size="medium" type="mail" />
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
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <a
            className="flex1"
            data-testid={`delete-subscription-${subscription.id}`}
            onClick={() => onDelete(subscription, type)}
          >
            <ButtonBorder>
              <GoAIcon type="trash" />
            </ButtonBorder>
          </a>
        </div>
      </td>
    </tr>
  );
};

interface SubscriptionsListComponentProps {
  className?: string;
  onDelete: (subscription: Subscriber, type: string) => void;
  searchCriteria: SubscriptionSearchCriteria;
}

const SubscriptionsListComponent: FunctionComponent<SubscriptionsListComponentProps> = ({
  className,
  onDelete,
  searchCriteria,
}) => {
  const dispatch = useDispatch();
  const subscription = useSelector((state: RootState) => state.subscription);
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const openModalFunction = (subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscription(true);
  };

  function reset() {
    setEditSubscription(false);
  }

  if (!subscription?.subscriptions) {
    return (
      <div>
        {' '}
        <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
      </div>
    );
  }

  const groupedSubscriptions = subscription?.subscriptions.reduce((acc, def) => {
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

  const searchFn = ({ type, searchCriteria }) => {
    dispatch(getTypeSubscriptions(type, searchCriteria));
  };

  return (
    <div className={className}>
      {!orderedGroupNames?.length && renderNoItem('subscription')}
      {orderedGroupNames.map((group, index) => (
        <div key={group}>
          <div className="group-name">{group}</div>
          <DataTable data-testid={`subscription-table-${index}`}>
            <thead>
              <tr>
                <th id="userName" data-testid={`subscription-header-address-as-${index}`}>
                  Address as
                </th>
                <th id="channels">Channels</th>
                <th id="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedSubscriptions[group].map((subscription) => (
                <SubscriptionComponent
                  key={`${subscription?.subscriber?.id}:${subscription?.subscriber?.urn}:${Math.random()}`}
                  subscription={subscription?.subscriber}
                  openModal={openModalFunction}
                  type={subscription?.typeId}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </DataTable>
          <SubscriptionNextLoader
            onSearch={searchFn}
            length={groupedSubscriptions[group].length}
            type={group}
            searchCriteria={searchCriteria}
          />
        </div>
      ))}
      {/* Form */}
      <SubscriberModalForm
        open={editSubscription}
        initialValue={selectedSubscription}
        // errors={errors}
        onSave={(subscriber) => {
          dispatch(UpdateSubscriberService(subscriber));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
    </div>
  );
};

const ButtonBorder = styled.div`
  border: 1px solid #56a0d8;
  margin: 3px;
  border-radius: 3px;
  width: fit-content;
  padding: 3px;
`;

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

const IconsCell = styled.div`
  display: flex;
  justify-content: space-around;
  width: 90%;
  width: 50%;
  margin: 5px 3px 0 0;
`;
