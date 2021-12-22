import React, { FunctionComponent, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { Subscriber, Subscription } from '@store/subscription/models';
import { UpdateSubscriber } from '@store/subscription/actions';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { SubscriberModalForm } from './editSubscriber';
import { GoAIcon } from '@abgov/react-components/experimental';

interface SubscriptionProps {
  subscription: Subscriber;
  readonly?: boolean;
  openModal?: (subscription: Subscription) => void;
}

const UnstyledSubscriptionComponent: FunctionComponent<SubscriptionProps> = ({ subscription, openModal }) => {
  return (
    <>
      <tr>
        <td headers="Address As" data-testid="addressAs">
          {subscription?.addressAs}
        </td>
        <td headers="Channels" data-testid="channels">
          {subscription?.channels.map((channel, i) => (
            <div key={`channels-id-${i}`} style={{ display: 'flex' }}>
              <div style={{ flex: 1, marginRight: '5px' }}>
                <b>{channel.channel}: </b>
              </div>
              <div>{channel.address}</div>
            </div>
          ))}
        </td>
        <a
          className="flex1"
          data-testid={`edit-notification-type-${subscription.id}`}
          onClick={() => openModal(subscription)}
        >
          <ButtonBorder className="smallPadding">
            <GoAIcon type="create" />
          </ButtonBorder>
        </a>
      </tr>
    </>
  );
};

interface SubscriptionsListComponentProps {
  className?: string;
}

const SubscriptionsListComponent: FunctionComponent<SubscriptionsListComponentProps> = ({ className }) => {
  const dispatch = useDispatch();
  const subscriptions = useSelector((state: RootState) => state.subscription.subscriptions);
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const openModalFunction = (subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscription(true);
  };

  function reset() {
    setEditSubscription(false);
  }

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
                <th id="addressAs" data-testid={`subscription-header-address-as-${index}`}>
                  Address As
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
                />
              ))}
            </tbody>
          </DataTable>
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

const ButtonBorder = styled.div`
  border: 1px solid #56a0d8;
  margin: 3px;
  border-radius: 3px;
`;

export const SubscriptionComponent = styled(UnstyledSubscriptionComponent)`
  .smallPadding {
    padding: 3px;
  }
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
