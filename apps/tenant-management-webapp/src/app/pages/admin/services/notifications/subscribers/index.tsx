import React, { FunctionComponent } from 'react';
import type { Subscriber, SubscriberSearchCriteria } from '@store/subscription/models';
import { SubscribersSearchForm } from './subscriverSearchForm'
import { useDispatch } from 'react-redux';
import { FindSubscribers } from "@store/subscription/actions";
import { ActionIndicator } from '@components/Indicator';

interface SubscribersProps {
  subscribers?: Subscriber[];
  readonly?: boolean;
}

export const Subscribers: FunctionComponent<SubscribersProps> = () => {
  const dispatch = useDispatch();
  const searchFn = (criteria: SubscriberSearchCriteria) => {
    dispatch(FindSubscribers(criteria));
  }

  return (
    <div>
      <ActionIndicator />
      <h1 data-testid='subcribers-list-title'>Subscribers</h1>
      <SubscribersSearchForm onSearch={searchFn} />
    </div>)
}
