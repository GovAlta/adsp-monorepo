import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SubscriptionList } from './subscriptionList';
import { getSubscriptions, Unsubscribe } from '@store/subscription/actions';
<<<<<<< HEAD
import type { Subscriber } from '@store/subscription/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
=======
import type { Subscriber, SubscriberSearchCriteria, SubscriptionSearchCriteria } from '@store/subscription/models';
>>>>>>> cc6fa8e8f47335d5e8ab6c5d259e53c6c9acf661
import { SubscribersSearchForm } from './subscribers/subscriberSearchForm';
import { CheckSubscriberRoles } from './checkSubscriberRoles';

export const Subscriptions: FunctionComponent = () => {
  const criteriaInit = {
    email: '',
    name: '',
  };
  const dispatch = useDispatch();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscriber>(null);
  const [selectedType, setSelectedType] = useState<string>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const [criteriaState, setCriteriaState] = useState<SubscriptionSearchCriteria>(criteriaInit);
  useEffect(() => {
    dispatch(getSubscriptions({}));
  }, []);

  const searchFn = ({ email, name }: SubscriberSearchCriteria) => {
    dispatch(getSubscriptions({ email, name }));
  };

  const resetState = () => {
    setCriteriaState(criteriaInit);
    dispatch(getSubscriptions({}));
  };

  const emailIndex = selectedSubscription?.channels?.findIndex((channel) => channel.channel === 'email');

  return (
    <CheckSubscriberRoles>
      <SubscribersSearchForm onSearch={searchFn} reset={resetState} />
      <SubscriptionList
        onDelete={(sub: Subscriber, type: string) => {
          setSelectedSubscription(sub);
          setShowDeleteConfirmation(true);
          setSelectedType(type);
        }}
        searchCriteria={criteriaState}
      />
      {/* Delete confirmation */}
<<<<<<< HEAD
      <GoAModal testId="delete-confirmation" isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Delete subscription</GoAModalTitle>
        <GoAModalContent>Delete subscription {selectedSubscription?.channels[emailIndex]?.address}?</GoAModalContent>
        <GoAModalActions>
          <GoAButton buttonType="tertiary" data-testid="delete-cancel" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="delete-confirm"
            onClick={() => {
              setShowDeleteConfirmation(false);
              dispatch(Unsubscribe({ data: { type: selectedType, data: selectedSubscription } }));
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
=======

      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete subscription"
          content={`Delete subscription ${selectedSubscription?.channels[emailIndex]?.address}?`}
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(Unsubscribe({ data: { type: selectedType, data: selectedSubscription } }));
          }}
        />
      )}
>>>>>>> cc6fa8e8f47335d5e8ab6c5d259e53c6c9acf661
    </CheckSubscriberRoles>
  );
};

export default Subscriptions;
