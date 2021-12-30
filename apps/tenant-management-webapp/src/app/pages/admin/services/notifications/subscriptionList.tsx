import React, { FunctionComponent, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { Subscriber, Subscription } from '@store/subscription/models';
import { UpdateSubscriberService } from '@store/subscription/actions';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { SubscriberModalForm } from './editSubscriber';
import { GoAIcon } from '@abgov/react-components/experimental';

interface SubscriptionProps {
  subscription: Subscriber;
  readonly?: boolean;
  openModal?: (subscription: Subscription) => void;
}

const SubscriptionComponent: FunctionComponent<SubscriptionProps> = ({ subscription, openModal }) => {
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
              <div>{channel.address}</div>
            </div>
          ))}
        </td>
        <td headers="actions" data-testid="actions">
          <a
            className="flex1"
            data-testid={`edit-notification-type-${subscription.id}`}
            onClick={() => openModal(subscription)}
          >
            <ButtonBorder className="smallPadding">
              <GoAIcon type="create" />
            </ButtonBorder>
          </a>
        </td>
      </tr>
    </>
  );
};

interface SubscriptionsListComponentProps {
  className?: string;
}

const SubscriptionsListComponent: FunctionComponent<SubscriptionsListComponentProps> = ({ className }) => {
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

  console.log(JSON.stringify(subscription.subscriptions) + '<subscriptionsddd');

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

// export const SubscriptionComponent = styled(UnstyledSubscriptionComponent)`
//   .smallPadding {
//     padding: 3px;
//   }

//   .flex1 {
//     flex: 1;
//   }
// `;

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
