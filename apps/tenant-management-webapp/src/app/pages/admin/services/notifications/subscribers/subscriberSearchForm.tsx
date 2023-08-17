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
import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
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
  const [criteria, setCriteria] = useState<SubscriberSearchCriteria>(searchCriteria);

  const onChangeFn = (name: string, value: string) => {
    setCriteria({
      ...criteria,
      [name]: value,
    });
  };

  return (
    <div>
      <GoAForm>
        <GoAFlexRow gap="small">
          <GoAFormItem>
            <label htmlFor="name">Search subscriber address as</label>
            <GoAInputText name="name" id="name" value={criteria?.name} onChange={onChangeFn} />
          </GoAFormItem>
          <GoAFormItem>
            <label htmlFor="email">Search subscriber email</label>
            <GoAInputEmail name="email" id="email" value={criteria?.email} onChange={onChangeFn} />
          </GoAFormItem>
          <GoAFormItem>
            <label htmlFor="sms">Search subscriber phone</label>
            <GoAInputText name="sms" id="sms" value={criteria?.sms} onChange={onChangeFn} />
          </GoAFormItem>
        </GoAFlexRow>
        <GoAFormActions alignment="right">
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="subscriber-search-reset-button"
              onClick={() => {
                reset();
              }}
            >
              Reset
            </GoAButton>
            <GoAButton
              testId="subscriber-search-search-button"
              onClick={() => {
                onSearch(criteria);
                onUpdate(criteria);
              }}
            >
              Search
            </GoAButton>
          </GoAButtonGroup>
        </GoAFormActions>
      </GoAForm>
    </div>
  );
};
