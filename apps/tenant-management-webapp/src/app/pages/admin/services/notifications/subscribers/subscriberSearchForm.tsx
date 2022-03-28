import React, { FunctionComponent } from 'react';
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
  reset?: () => void;
  searchCriteria?: SubscriberSearchCriteria;
  onUpdate: (searchCriteria: SubscriberSearchCriteria) => void;
}

export const SubscribersSearchForm: FunctionComponent<EventSearchFormProps> = ({
  onSearch,
  reset,
  searchCriteria,
  onUpdate,
}) => {
  const onChangeFn = (name: string, value: string) => {
    if (name === 'name') {
      onUpdate({
        ...searchCriteria,
        name: value,
      });
    }

    if (name === 'email') {
      onUpdate({
        ...searchCriteria,
        email: value,
      });
    }
  };
  return (
    <div>
      <GoAForm>
        <GoAFlexRow gap="small">
          <GoAFormItem>
            <label htmlFor="name">Search subscriber address as</label>
            <GoAInputText name="name" id="name" value={searchCriteria?.name} onChange={onChangeFn} />
          </GoAFormItem>
          <GoAFormItem>
            <label htmlFor="email">Search subscriber email</label>
            <GoAInputEmail name="email" id="email" value={searchCriteria?.email} onChange={onChangeFn} />
          </GoAFormItem>
        </GoAFlexRow>
        <GoAFormActions alignment="right">
          <GoAButton
            buttonType="secondary"
            title="Reset"
            onClick={() => {
              reset();
            }}
          >
            Reset
          </GoAButton>
          <GoAButton title="Search" onClick={() => onSearch(searchCriteria)}>
            Search
          </GoAButton>
        </GoAFormActions>
      </GoAForm>
    </div>
  );
};
