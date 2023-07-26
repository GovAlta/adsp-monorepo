import React, { FunctionComponent, useState } from 'react';
import type { SubscriberSearchCriteria } from '@store/subscription/models';
import { isSmsValid, emailError, smsError } from '@lib/inputValidation';

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
import { ErrorWrapper } from './editSubscriber';

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
  const [formErrors, setFormErrors] = useState(null);
  const onChangeFn = (name: string, value: string) => {
    setCriteria({
      ...criteria,
      [name]: value,
    });
  };
  const Search = (criteria) => {
    const formErrorList = Object.assign(
      {},
      criteria?.email !== '' ? emailError(criteria?.email) : null,
      smsError(criteria?.sms)
    );
    if (Object.keys(formErrorList).length === 0) {
      onSearch(criteria);
      onUpdate(criteria);
      setFormErrors(null);
    } else {
      setFormErrors(formErrorList);
    }
  };
  return (
    <div>
      <GoAForm>
        <ErrorWrapper>
          <GoAFlexRow gap="small">
            <GoAFormItem>
              <label htmlFor="name">Search subscriber address as</label>
              <GoAInputText name="name" id="name" value={criteria?.name} onChange={onChangeFn} />
            </GoAFormItem>
            <GoAFormItem error={formErrors?.['email']}>
              <label>Search subscriber email</label>
              <GoAInputEmail
                name="email"
                id="email"
                value={criteria?.email || ''}
                aria-label="email"
                onChange={(_, value) => {
                  setCriteria({ ...criteria, email: value });
                }}
              />
            </GoAFormItem>

            <GoAFormItem error={formErrors?.['sms']}>
              <label htmlFor="sms">Search subscriber phone</label>
              <GoAInputText
                name="sms"
                id="sms"
                value={criteria?.sms || ''}
                onChange={(_, value) => {
                  if (isSmsValid(value)) {
                    setCriteria({ ...criteria, sms: value?.substring(0, 10) });
                  }
                }}
              />
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
            <GoAButton title="Search" onClick={(e) => Search(criteria)}>
              Search
            </GoAButton>
          </GoAFormActions>
        </ErrorWrapper>
      </GoAForm>
    </div>
  );
};
