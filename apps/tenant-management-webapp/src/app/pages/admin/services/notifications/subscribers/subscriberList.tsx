import React, { FunctionComponent, useState } from 'react';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { GoAIcon } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import { SubscriberModalForm } from '../editSubscriber';
import { UpdateSubscriberService } from '@store/subscription/actions';

export const SubscriberList: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  function characterLimit(string, limit) {
    if (string?.length > limit) {
      const slicedString = string.slice(0, limit);
      return slicedString + '...';
    } else {
      return string;
    }
  }
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
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber) => {
            const emailIndex = subscriber?.channels?.findIndex((channel) => channel.channel === 'email');
            return (
              <tr key={subscriber.id}>
                <td>{characterLimit(subscriber?.addressAs, 30)}</td>
                <td>{characterLimit(subscriber?.channels[emailIndex]?.address, 30)}</td>
                <td>
                  <a
                    className="flex1"
                    data-testid={`edit-subscription-item-${subscriber.id}`}
                    onClick={() => openModalFunction(subscriber)}
                  >
                    <ButtonBorder>
                      <GoAIcon type="create" />
                    </ButtonBorder>
                  </a>
                </td>
              </tr>
            );
          })}
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
