import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { SubscriptionList } from './subscriptionList';
import { getSubscriptions } from '@store/subscription/actions';

export const Subscriptions: FunctionComponent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getSubscriptions());
  }, []);

  return (
    <>
      <SubscriptionList />
    </>
  );
};

export default Subscriptions;
