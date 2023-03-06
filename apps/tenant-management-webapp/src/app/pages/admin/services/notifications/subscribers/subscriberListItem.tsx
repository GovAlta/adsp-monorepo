import React, { FunctionComponent, useState, useEffect } from 'react';
import { Subscriber } from '@store/subscription/models';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { phoneWrapper } from '@lib/wrappers';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { ToggleShowSubs } from '@store/subscription/actions';
import { GetSubscriberSubscriptions } from '@store/subscription/actions';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { RowFlex } from './styled-components';

interface ActionComponentProps {
  subscriber: Subscriber;
  openModalFunction?: (subscriber: Subscriber) => void;
  openDeleteModalFunction?: (subscriber: Subscriber) => void;
  hideUserActions?: boolean;
}

export const SubscriberListItem: FunctionComponent<ActionComponentProps> = ({
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
  const email = subscriber?.channels?.find(({ channel }) => channel === 'email')?.address;
  const sms = subscriber?.channels?.find(({ channel }) => channel === 'sms')?.address;
  return (
    <>
      <tr key={subscriber.id}>
        <td>{characterLimit(subscriber?.addressAs, 30)}</td>
        <td>{characterLimit(email, 30)}</td>
        <td className="no-wrap">{phoneWrapper(sms)}</td>
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
                type={subscriberSubscriptions?.showHide ? 'eye-off' : 'eye'}
                onClick={() => {
                  if (!subscriberSubscriptions) {
                    dispatch(GetSubscriberSubscriptions(subscriber, null));
                  } else {
                    dispatch(ToggleShowSubs(subscriber));
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
      {subscriberSubscriptions?.showHide && (
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
