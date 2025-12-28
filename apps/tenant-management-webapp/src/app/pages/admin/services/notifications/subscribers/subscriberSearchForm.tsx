import React, { FunctionComponent, useState } from 'react';
import type { SubscriberSearchCriteria } from '@store/subscription/models';

import { GoabButton, GoabButtonGroup, GoabInput, GoabGrid, GoabFormItem } from '@abgov/react-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

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
      <GoabGrid minChildWidth="26ch" gap="m">
        <GoabFormItem label="Search subscriber address as">
          <GoabInput
            name="name"
            testId="subscriber-name-input"
            id="name"
            width="100%"
            value={criteria?.name}
            onChange={(detail: GoabInputOnChangeDetail) => onChangeFn(detail.name, detail.value)}
          />
        </GoabFormItem>
        <GoabFormItem label="Search subscriber email">
          <GoabInput
            type="email"
            testId="subscriber-email-input"
            name="email"
            width="100%"
            id="email"
            value={criteria?.email}
            onChange={(detail: GoabInputOnChangeDetail) => onChangeFn(detail.name, detail.value)}
          />
        </GoabFormItem>
        <GoabFormItem label="Search subscriber phone">
          <GoabInput
            type="tel"
            name="sms"
            testId="subscriber-phone-input"
            id="sms"
            width="100%"
            value={criteria?.sms}
            onChange={(detail: GoabInputOnChangeDetail) => onChangeFn(detail.name, detail.value)}
          />
        </GoabFormItem>
      </GoabGrid>

      <GoabButtonGroup alignment="end">
        <GoabButton
          type="secondary"
          testId="subscriber-search-reset-button"
          onClick={() => {
            reset();
          }}
        >
          Reset
        </GoabButton>
        <GoabButton
          testId="subscriber-search-search-button"
          onClick={() => {
            onSearch(criteria);
            onUpdate(criteria);
          }}
        >
          Search
        </GoabButton>
      </GoabButtonGroup>
    </div>
  );
};
