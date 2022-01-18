import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { GoAIcon } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import { SubscriberModalForm } from '../editSubscriber';
import { UpdateSubscriberService } from '@store/subscription/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Subscriber, SubscriptionWrapper } from '@store/subscription/models';
import { getSubscriberSubscriptions, TriggerVisibilitySubscribersService } from '@store/subscription/actions';

interface ActionComponentProps {
  subscriber: Subscriber;
  openModalFunction: (subscriber: Subscriber) => void;
}

const ActionComponent: FunctionComponent<ActionComponentProps> = ({ subscriber, openModalFunction }) => {
  function characterLimit(string, limit) {
    if (string?.length > limit) {
      const slicedString = string.slice(0, limit);
      return slicedString + '...';
    } else {
      return string;
    }
  }
  const currentSubscriberAndSubscription = useSelector(
    (state: RootState) => state.subscription.subscriberSubscriptions[subscriber.id]
  );

  const dispatch = useDispatch();

  const emailIndex = subscriber?.channels?.findIndex((channel) => channel.channel === 'email');

  const getSubscriptions = () => {
    if (!currentSubscriberAndSubscription) {
      dispatch(getSubscriberSubscriptions(subscriber));
    } else {
      dispatch(TriggerVisibilitySubscribersService(subscriber));
    }
  };

  return (
    <>
      <tr key={subscriber.id}>
        <td>{characterLimit(subscriber?.addressAs, 30)}</td>
        <td>{characterLimit(subscriber?.channels[emailIndex]?.address, 30)}</td>
        <td>
          <RowFlex>
            <Flex1>
              <GoAContextMenuIcon
                type={currentSubscriberAndSubscription?.subscriber?.visibleSubscriptions ? 'eye-off' : 'eye'}
                onClick={() => getSubscriptions()}
                testId="toggle-details-visibility"
              />
            </Flex1>
            <Flex1>
              <a data-testid={`edit-subscription-item-${subscriber.id}`} onClick={() => openModalFunction(subscriber)}>
                <ButtonBorder>
                  <GoAIcon type="create" />
                </ButtonBorder>
              </a>
            </Flex1>
          </RowFlex>
        </td>
      </tr>
      {currentSubscriberAndSubscription?.subscriber?.visibleSubscriptions && (
        <tr>
          <td>
            <h2>Subscriptions</h2>
            {currentSubscriberAndSubscription?.subscriptions.map((subscription, i) => {
              return <div data-testid={`subscriptions-${i}`}>{subscription.typeId}</div>;
            })}
          </td>
        </tr>
      )}
    </>
  );
};

export const SubscriberList: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const subscription = useSelector((state: RootState) => state.subscription);
  const subscribers = subscription.search.subscribers.data;
  if (!subscribers || subscribers.length === 0) {
    return <></>;
  }

  const openModalFunction = (subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscription(true);
  };

  function reset() {
    setEditSubscription(false);
    setSelectedSubscription(null);
  }

  return (
    <div>
      <DataTable>
        <thead>
          <tr>
            <th>Address as</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber) => (
            <ActionComponent
              openModalFunction={openModalFunction}
              subscriber={subscriber}
              key={`${subscriber.urn}:${Math.random()}`}
            />
          ))}
        </tbody>
      </DataTable>
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

const RowFlex = styled.div`
  display: flex;
  flex-direction: row;
`;

const Flex1 = styled.div`
  display: flex;
  flex-direction: row;
`;
