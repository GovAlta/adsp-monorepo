import React, { useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { DataTableStyle } from './styled-components';
import { SubscriberModalForm } from './editSubscriber';
import { DeleteSubscriber, UpdateSubscriber } from '@store/subscription/actions';
import { renderNoItem } from '@components/NoItem';
import { DeleteModal } from '@components/DeleteModal';
import type { SubscriberSearchCriteria } from '@store/subscription/models';
import { SubscriberListItem } from './subscriberListItem';

interface SubscriberListProps {
  searchCriteria: SubscriberSearchCriteria;
}
export const SubscriberList = (props: SubscriberListProps): JSX.Element => {
  const dispatch = useDispatch();
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [selectedDeleteSubscriberId, setSelectedDeleteSubscriberId] = useState(null);

  const search = useSelector((state: RootState) => state.subscription.subscriberSearch);

  const subscribers = useSelector((state: RootState) => {
    if (state.subscription.subscriberSearch.results) {
      return state.subscription.subscriberSearch.results
        .map((id) => state.subscription.subscribers[id])
        .filter((subs) => !!subs);
    } else {
      return null;
    }
  });

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

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
      {indicator.show === false && subscribers && subscribers.length === 0 && renderNoItem('subscriber')}
      {(subscribers === null || subscribers.length > 0) && (
        <DataTableStyle>
          <DataTable>
            <thead>
              <tr>
                <th className="spread">Address as</th>
                <th className="spread">Email</th>
                <th className="spread">Phone</th>
                <th className="action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers &&
                subscribers?.length > 0 &&
                subscribers?.map((subscriber) => (
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
        </DataTableStyle>
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
