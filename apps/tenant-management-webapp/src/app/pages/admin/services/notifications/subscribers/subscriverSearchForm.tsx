import React, { FunctionComponent, useState } from 'react';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import type { SubscriberSearchCriteria } from '@store/subscription/models';

import {
  GoAForm,
  GoAFormItem,
  GoAFlexRow,
  GoAButton,
  GoAInputText,
  GoAInputEmail,
} from '@abgov/react-components/experimental';

import { SubscriberList } from './subscriberList';

interface EventSearchFormProps {
  onSearch?: (searchCriteria: SubscriberSearchCriteria) => void;
}

interface EventSearchNextProps {
  onSearch?: (searchCriteria: SubscriberSearchCriteria) => void;
  searchCriteria: SubscriberSearchCriteria;
}

export const NextLoader: FunctionComponent<EventSearchNextProps> = ({ onSearch, searchCriteria }) => {
  const hasNext = useSelector((state: RootState) => state.subscription.search.subscribers.hasNext);

  if (hasNext) {
    return (
      <GoAButton
        onClick={() => {
          searchCriteria.next = true;
          onSearch(searchCriteria);
        }}
      >
        Load more...
      </GoAButton>
    );
  } else {
    return <></>;
  }
};

export const SubscribersSearchForm: FunctionComponent<EventSearchFormProps> = ({ onSearch }) => {
  const criteriaInit = {
    email: '',
    name: '',
  };

  const [criteriaState, setCriteriaState] = useState<SubscriberSearchCriteria>(criteriaInit);

  const onChangeFn = (name: string, value: string) => {
    if (name === 'name') {
      criteriaState.name = value;
    }

    if (name === 'email') {
      criteriaState.email = value;
    }
    setCriteriaState({ ...criteriaState });
    onSearch(criteriaState);
  };

  return (
    <div>
      <GoAForm>
        <GoAFlexRow gap="small">
          <GoAFormItem>
            <label htmlFor="name">Name </label>
            <GoAInputText name="name" id="name" value={criteriaState?.name} onChange={onChangeFn} />
          </GoAFormItem>
          <GoAFormItem>
            <label htmlFor="email">Email</label>
            <GoAInputEmail name="email" id="email" value={criteriaState?.email} onChange={onChangeFn} />
          </GoAFormItem>
        </GoAFlexRow>
      </GoAForm>
      <SubscriberList />
      <NextLoader onSearch={onSearch} searchCriteria={criteriaState} />
    </div>
  );
};
