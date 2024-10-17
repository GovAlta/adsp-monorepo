import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SubscriptionList } from './subscriptionList';
import { GetAllTypeSubscriptions, DeleteSubscription } from '@store/subscription/actions';
import type { Subscriber, SubscriberSearchCriteria, SubscriptionSearchCriteria } from '@store/subscription/models';
import { SubscribersSearchForm } from '../subscribers/subscriberSearchForm';
import { CheckSubscriberRoles } from './checkSubscriberRoles';
import { DeleteModal } from '@components/DeleteModal';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { Events } from '@store/subscription/models';

export const Subscriptions: FunctionComponent = () => {
  const criteriaInit = {
    email: '',
    name: '',
  };
  const dispatch = useDispatch();

  const indicator = useSelector((state: RootState) => {
    return state.session.indicator;
  });

  const loadingState = useSelector((state: RootState) => {
    return state.session.loadingStates.find((state) => state.name === Events.search);
  });

  const [selectedSubscription, setSelectedSubscription] = useState<Subscriber>(null);
  const [selectedType, setSelectedType] = useState<string>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const [criteriaState, setCriteriaState] = useState<SubscriptionSearchCriteria>(criteriaInit);
  useEffect(() => {
    if (criteriaState.email === '' && criteriaState.name === '') {
      dispatch(GetAllTypeSubscriptions({}));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const searchFn = ({ email, name, sms }: SubscriberSearchCriteria) => {
    dispatch(GetAllTypeSubscriptions({ email, name, sms }));
  };

  const resetState = () => {
    dispatch(GetAllTypeSubscriptions({}));
    setCriteriaState(criteriaInit);
  };

  const emailIndex = selectedSubscription?.channels?.findIndex((channel) => channel.channel === 'email');

  return (
    <section>
      <CheckSubscriberRoles>
        <SubscribersSearchForm
          onSearch={searchFn}
          reset={resetState}
          searchCriteria={criteriaState}
          onUpdate={setCriteriaState}
        />
        {indicator.show && <PageIndicator />}

        {(indicator.show === false && loadingState === undefined) ||
          (loadingState?.state === 'completed' && (
            <SubscriptionList
              onDelete={(sub: Subscriber, type: string) => {
                setSelectedSubscription(sub);
                setShowDeleteConfirmation(true);
                setSelectedType(type);
              }}
              searchCriteria={criteriaState}
            />
          ))}

        {/* Delete confirmation */}
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete subscription"
          content={
            <div>
              Are you sure you wish to delete <b>{selectedSubscription?.channels[emailIndex]?.address}</b>?
            </div>
          }
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(DeleteSubscription({ data: { type: selectedType, data: selectedSubscription } }));
          }}
        />
      </CheckSubscriberRoles>
    </section>
  );
};

export default Subscriptions;
