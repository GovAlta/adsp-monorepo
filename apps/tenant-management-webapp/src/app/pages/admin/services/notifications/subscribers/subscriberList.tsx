import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import styled from 'styled-components';
import { SubscriberModalForm } from '../editSubscriber';
import { UpdateSubscriber } from '@store/subscription/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Subscriber } from '@store/subscription/models';
import { GetSubscriberSubscriptions, DeleteSubscriber } from '@store/subscription/actions';
import { renderNoItem } from '@components/NoItem';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { DeleteModal } from '@components/DeleteModal';
import type { SubscriberSearchCriteria } from '@store/subscription/models';

interface ActionComponentProps {
  subscriber: Subscriber;
  openModalFunction?: (subscriber: Subscriber) => void;
  openDeleteModalFunction?: (subscriber: Subscriber) => void;
  hideUserActions?: boolean;
}

const SubscriberListItem: FunctionComponent<ActionComponentProps> = ({
  subscriber,
  openModalFunction,
  hideUserActions = false,
  openDeleteModalFunction,
}) => {
  // TODO: this should be overflow ellipse as a css style instead of modifying value in DOM?
  function characterLimit(string, limit) {
    if (string?.length > limit) {
      const slicedString = string.slice(0, limit);
      return slicedString + '...';
    } else {
      return string;
    }
  }
  const subscriberSubscriptions = useSelector(
    (state: RootState) => state.subscription.subscriberSubscriptionSearch[subscriber.id]
  );

  const dispatch = useDispatch();
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const email = subscriber?.channels?.find(({ channel }) => channel === 'email')?.address;
  const sms = subscriber?.channels?.find(({ channel }) => channel === 'sms')?.address;

  return (
    <>
      <tr key={subscriber.id}>
        <td>{characterLimit(subscriber?.addressAs, 30)}</td>
        <td>{characterLimit(email, 30)}</td>
        <td>
          <span style={{ whiteSpace: 'nowrap' }}>{sms}</span>
        </td>
        {!hideUserActions ? (
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
                type={showSubscriptions ? 'eye-off' : 'eye'}
                onClick={() => {
                  setShowSubscriptions(!showSubscriptions);
                  if (!showSubscriptions) {
                    dispatch(GetSubscriberSubscriptions(subscriber, null));
                  }
                }}
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
                  openDeleteModalFunction(subscriber);
                }}
              />
            </RowFlex>
          </td>
        ) : (
          ''
        )}
      </tr>
      {showSubscriptions && (
        <tr>
          <td colSpan={3}>
            <h2>Subscriptions</h2>
            {subscriberSubscriptions?.results?.length < 1 ? (
              <span>
                <b>No subscriptions</b>
              </span>
            ) : (
              ''
            )}
            {subscriberSubscriptions?.results.map((typeId, i) => {
              return (
                <div data-testid={`subscriptions-${i}`}>
                  <b>{typeId}</b>
                </div>
              );
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
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [selectedDeleteSubscriberId, setSelectedDeleteSubscriberId] = useState(null);

  const search = useSelector((state: RootState) => state.subscription.subscriberSearch);

  const subscribers = useSelector((state: RootState) =>
    state.subscription.subscriberSearch.results.map((id) => state.subscription.subscribers[id]).filter((subs) => !!subs)
  );

  useEffect(() => {
    reset();
  }, [search]);

  // eslint-disable-next-line
  const openModalFunction = (subscription) => {
    setSelectedSubscriber(subscription);
    setEditSubscription(true);
  };

  const openDeleteModalFunction = (subscriber) => {
    setSelectedDeleteSubscriberId(subscriber.id);
    setSelectedSubscriber(subscriber);
  };

  function reset() {
    setEditSubscription(false);
    setSelectedSubscriber(null);
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
              <th>Phone</th>
              <th style={{ width: '0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => (
              <SubscriberListItem
                openModalFunction={openModalFunction}
                subscriber={subscriber}
                openDeleteModalFunction={openDeleteModalFunction}
                key={subscriber.id}
                hideUserActions={false}
              />
            ))}
          </tbody>
        </DataTable>
      )}
      <SubscriberModalForm
        open={editSubscription}
        initialValue={selectedSubscriber}
        onSave={(subscriber) => {
          dispatch(UpdateSubscriber(subscriber));
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
            <div>Deletion of the following subscriber will remove all of its related subscriptions.</div>
            <div>Do you still want to continue?</div>
            {selectedSubscriber ? (
              <DataTable>
                <thead>
                  <tr>
                    <th>Address as</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  <SubscriberListItem
                    subscriber={selectedSubscriber}
                    key={selectedSubscriber.id}
                    hideUserActions={true}
                  />
                </tbody>
              </DataTable>
            ) : (
              ''
            )}
          </div>
        }
        onDelete={() => {
          dispatch(DeleteSubscriber(selectedDeleteSubscriberId));
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
