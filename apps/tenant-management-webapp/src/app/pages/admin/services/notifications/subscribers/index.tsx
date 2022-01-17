import React, { FunctionComponent, useEffect, useState } from 'react';
import type { Subscriber, SubscriberSearchCriteria } from '@store/subscription/models';
import { SubscribersSearchForm } from './subscriberSearchForm';
import { useDispatch } from 'react-redux';
import { FindSubscribers, ResetVisibilityInSubscribersService } from '@store/subscription/actions';
import { ActionIndicator } from '@components/Indicator';
import { SubscriberList } from './subscriberList';
import { NextLoader } from './nextLoader';

interface SubscribersProps {
  subscribers?: Subscriber[];
  readonly?: boolean;
}

export const Subscribers: FunctionComponent<SubscribersProps> = () => {
  const criteriaInit = {
    email: '',
    name: '',
  };
  const dispatch = useDispatch();
  const [criteriaState, setCriteriaState] = useState<SubscriberSearchCriteria>(criteriaInit);
  const searchFn = ({ searchCriteria }) => {
    dispatch(FindSubscribers(searchCriteria));
    setCriteriaState(searchCriteria);
  };

  const searchFn2 = (criteria: SubscriberSearchCriteria) => {
    dispatch(FindSubscribers(criteria));
    setCriteriaState(criteria);
  };

  const resetState = (resetCriteria) => {
    dispatch(FindSubscribers(resetCriteria));
    setCriteriaState(criteriaInit);
    dispatch(ResetVisibilityInSubscribersService());
  };

  useEffect(() => {
    dispatch(FindSubscribers(criteriaInit));
  }, []);

  return (
    <div data-testid="subscribers-list-title">
      <ActionIndicator />

      <SubscribersSearchForm onSearch={searchFn2} reset={resetState} />
      <SubscriberList />
      <NextLoader onSearch={searchFn} searchCriteria={criteriaState} />
    </div>
  );
};
