import React, { FunctionComponent, useEffect, useState } from 'react';
import type { Subscriber, SubscriberSearchCriteria } from '@store/subscription/models';
import { SubscribersSearchForm } from './subscriberSearchForm';
import { useDispatch, useSelector } from 'react-redux';
import { FindSubscribers } from '@store/subscription/actions';
import { SubscriberList } from './subscriberList';
import { NextLoader } from './nextLoader';
import { PageIndicator } from '@components/Indicator';
import { GoabCallout } from '@abgov/react-components';
import { RootState } from '@store/index';
import { useHasRole } from '../subscription/useHasRole';

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

  const dispatch = useDispatch();
  const [criteriaState, setCriteriaState] = useState<SubscriberSearchCriteria>(criteriaInit);

  const searchFn = ({ searchCriteria }) => {
    dispatch(FindSubscribers(searchCriteria));
    setCriteriaState(searchCriteria);
  };

  const searchFn2 = (criteria: SubscriberSearchCriteria) => {
    const resetCriteria = { ...criteria, paginationReset: true };
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSubscriptionAdmin = useHasRole('subscription-admin');

  if (!hasSubscriptionAdmin) {
    return (
      <GoabCallout type="important" testId="check-role-callout">
        <h3>Access to subscriptions requires admin roles</h3>
        <p>
          You require the <strong>subscription-admin</strong> role to access notifications. Contact your administrator
          if you believe this is an error.
        </p>
      </GoabCallout>
    );
  }

  return (
    <section>
      <div data-testid="subscribers-list-title">
        <SubscribersSearchForm
          onSearch={searchFn2}
          reset={resetState}
          searchCriteria={criteriaState}
          onUpdate={setCriteriaState}
        />

        <SubscriberList searchCriteria={criteriaState} />
        {indicator.show === false && subscribers?.length > 0 && (
          <NextLoader onSearch={searchFn} searchCriteria={criteriaState} />
        )}
        {indicator.show && <PageIndicator />}
      </div>
    </section>
  );
};
