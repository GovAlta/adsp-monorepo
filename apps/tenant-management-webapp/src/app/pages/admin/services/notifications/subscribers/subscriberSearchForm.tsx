import React, { FunctionComponent, useState } from 'react';
import type { SubscriberSearchCriteria } from '@store/subscription/models';

import { GoAButton, GoAButtonGroup, GoAInput, GoAGrid, GoAFormItem } from '@abgov/react-components-new';

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
      <GoAGrid minChildWidth="26ch" gap="m">
        <GoAFormItem label="Search subscriber address as">
          <GoAInput
            name="name"
            testId="subscriber-name-input"
            id="name"
            width="100%"
            value={criteria?.name}
            onChange={onChangeFn}
          />
        </GoAFormItem>
        <GoAFormItem label="Search subscriber email">
          <GoAInput
            type="email"
            testId="subscriber-email-input"
            name="email"
            width="100%"
            id="email"
            value={criteria?.email}
            onChange={onChangeFn}
          />
        </GoAFormItem>
        <GoAFormItem label="Search subscriber phone">
          <GoAInput
            type="tel"
            name="sms"
            testId="subscriber-phone-input"
            id="sms"
            width="100%"
            value={criteria?.sms}
            onChange={onChangeFn}
          />
        </GoAFormItem>
      </GoAGrid>

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
    </div>
  );
};
