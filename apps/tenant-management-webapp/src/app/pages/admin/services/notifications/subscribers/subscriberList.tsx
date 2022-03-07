import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import styled from 'styled-components';
import { SubscriberModalForm } from '../editSubscriber';
import { ResetUpdateErrors, UpdateSubscriberService } from '@store/subscription/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Subscriber } from '@store/subscription/models';
import {
  getSubscriberSubscriptions,
  TriggerVisibilitySubscribersService,
  DeleteSubscriberService,
} from '@store/subscription/actions';
import { renderNoItem } from '@components/NoItem';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { DeleteModal } from '@components/DeleteModal';
import type { SubscriberSearchCriteria } from '@store/subscription/models';

interface ActionComponentProps {
  subscriber: Subscriber;
  openModalFunction: (subscriber: Subscriber) => void;
  openDeleteModalFunction: (subscriber: string) => void;
}

const ActionComponent: FunctionComponent<ActionComponentProps> = ({
  subscriber,
  openModalFunction,
  openDeleteModalFunction,
}) => {
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
            <div data-account-link={subscriber.accountLink}>
              <GoAContextMenuIcon
                type={'person'}
                onClick={() => {
                  window.open(subscriber.accountLink, '_blank');
                }}
                testId="subscriber-account-link"
              />
            </div>
            <GoAContextMenuIcon
              type={currentSubscriberAndSubscription?.subscriber?.visibleSubscriptions ? 'eye-off' : 'eye'}
              onClick={() => getSubscriptions()}
              testId="toggle-details-visibility"
            />
            <GoAContextMenuIcon
              type="create"
              title="Edit"
              onClick={() => openModalFunction(subscriber)}
              testId={`edit-subscription-item-${subscriber.id}`}
            />

            <GoAIconButton
              data-testid="delete-icon"
              size="medium"
              type="trash"
              onClick={() => {
                openDeleteModalFunction(subscriber.id);
              }}
            />
          </RowFlex>
        </td>
      </tr>
      {currentSubscriberAndSubscription?.subscriber?.visibleSubscriptions && (
        <tr>
          <td colSpan={3}>
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

interface SubscriberListProps {
  searchCriteria: SubscriberSearchCriteria;
}
export const SubscriberList = (props: SubscriberListProps): JSX.Element => {
  const dispatch = useDispatch();
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedDeleteSubscriberId, setSelectedDeleteSubscriberId] = useState(null);

  const search = useSelector((state: RootState) => state.subscription.search);

  const subscribers = useSelector((state: RootState) =>
    state.subscription.search.results.map((id) => state.subscription.subscribers[id])
  );

  useEffect(() => {
    reset();
  }, [search]);

  // eslint-disable-next-line
  const openModalFunction = (subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscription(true);
  };

  const openDeleteModalFunction = (subscriberId) => {
    setSelectedDeleteSubscriberId(subscriberId);
  };

  function reset() {
    setEditSubscription(false);
    setSelectedSubscription(null);
    dispatch(ResetUpdateErrors());
  }

  return (
    <div>
      {subscribers && subscribers.length === 0 && renderNoItem('subscriber')}
      {subscribers && subscribers.length > 0 && (
        <DataTable>
          <thead>
            <tr>
              <th>Address as</th>
              <th>Email</th>
              <th style={{ width: '0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => (
              <ActionComponent
                openModalFunction={openModalFunction}
                subscriber={subscriber}
                openDeleteModalFunction={openDeleteModalFunction}
                key={`${subscriber.urn}:${Math.random()}`}
              />
            ))}
          </tbody>
        </DataTable>
      )}
      <SubscriberModalForm
        open={editSubscription}
        initialValue={selectedSubscription}
        onSave={(subscriber) => {
          dispatch(UpdateSubscriberService(subscriber));
          setEditSubscription(false);
        }}
        onCancel={() => {
          reset();
        }}
      />
      <DeleteModal
        title="Delete subscriber"
        isOpen={selectedDeleteSubscriberId !== null}
        onCancel={() => {
          setSelectedDeleteSubscriberId(null);
        }}
        content={
          <div>
            <div>Deletion of a subscriber will remove all of its related subscriptions.</div>
            <div>Do you still want to continue?</div>
          </div>
        }
        onDelete={() => {
          dispatch(DeleteSubscriberService(selectedDeleteSubscriberId, props.searchCriteria));
          setSelectedDeleteSubscriberId(null);
        }}
      />
    </div>
  );
};

const RowFlex = styled.div`
  display: flex;
  flex-direction: row;
  & > :not([data-account-link]):first-child {
    visibility: hidden;
  }
`;
