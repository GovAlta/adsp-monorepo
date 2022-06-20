import React, { FunctionComponent, useEffect, useState } from 'react';
import type { Subscriber, SubscriberSearchCriteria } from '@store/subscription/models';
import { SubscribersSearchForm } from './subscriberSearchForm';
import { useDispatch, useSelector } from 'react-redux';
import { FindSubscribers } from '@store/subscription/actions';
import { SubscriberList } from './subscriberList';
import { NextLoader } from './nextLoader';
import { CheckSubscriberRoles } from '../checkSubscriberRoles';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';

interface SubscribersProps {
  subscribers?: Subscriber[];
  readonly?: boolean;
}

export const Subscribers: FunctionComponent<SubscribersProps> = () => {
  const criteriaInit = {
    email: '',
    name: '',
    top: 10,
    next: null,
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();
  const [criteriaState, setCriteriaState] = useState<SubscriberSearchCriteria>(criteriaInit);
  const searchFn = ({ searchCriteria }) => {
    dispatch(FindSubscribers(searchCriteria));
    setCriteriaState(searchCriteria);
  };

  const searchFn2 = (criteria: SubscriberSearchCriteria) => {
    const resetCriteria = { ...criteria, reset: true };
    dispatch(FindSubscribers(resetCriteria));
    setCriteriaState(criteria);
  };

  const resetState = () => {
    const resetCriteria = { ...criteriaInit, reset: true };
    dispatch(FindSubscribers(resetCriteria));

    setCriteriaState(criteriaInit);
  };

  useEffect(() => {
    dispatch(FindSubscribers(criteriaInit));
  }, []);

  return (
    <CheckSubscriberRoles>
      <div data-testid="subscribers-list-title">
        <SubscribersSearchForm
          onSearch={searchFn2}
          reset={resetState}
          searchCriteria={criteriaState}
          onUpdate={setCriteriaState}
        />

        <SubscriberList searchCriteria={criteriaState} />
        {indicator.show === false && <NextLoader onSearch={searchFn} searchCriteria={criteriaState} />}
        {indicator.show && <PageIndicator />}
      </div>
    </CheckSubscriberRoles>
  );
};
