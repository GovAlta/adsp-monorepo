import React, { FunctionComponent, useState } from 'react';
import type { SubscriberSearchCriteria } from '@store/subscription/models';

import {
  GoAForm,
  GoAFormItem,
  GoAFlexRow,
  GoAInputText,
  GoAInputEmail,
  GoAFormActions,
} from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import '@abgov/core-css/src/lib/styles/v2/colors.scss';

interface EventSearchFormProps {
  onSearch?: (searchCriteria: SubscriberSearchCriteria) => void;
  reset?: (searchCriteria: SubscriberSearchCriteria) => void;
}

export const SubscribersSearchForm: FunctionComponent<EventSearchFormProps> = ({ onSearch, reset }) => {
  const criteriaInit = {
    email: '',
    name: '',
  };

  const resetCriteria = {
    email: '',
    name: '',
    top: 10,
    next: null,
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
  };

  return (
    <div>
      <GoAForm>
        <GoAFlexRow gap="small">
          <GoAFormItem>
            <label htmlFor="name">Search subscriber address as</label>
            <GoAInputText name="name" id="name" value={criteriaState?.name} onChange={onChangeFn} />
          </GoAFormItem>
          <GoAFormItem>
            <label htmlFor="email">Search subscriber email</label>
            <GoAInputEmail name="email" id="email" value={criteriaState?.email} onChange={onChangeFn} />
          </GoAFormItem>
        </GoAFlexRow>
        <GoAFormActions alignment="right">
          <GoAButton
            buttonType="secondary"
            title="Reset"
            onClick={() => {
              setCriteriaState(criteriaInit);
              reset(resetCriteria);
            }}
          >
            Reset
          </GoAButton>
          <GoAButton title="Search" onClick={() => onSearch(criteriaState)}>
            Search
          </GoAButton>
        </GoAFormActions>
      </GoAForm>
    </div>
  );
};
