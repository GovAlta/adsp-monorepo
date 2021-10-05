import React, { FunctionComponent, useState } from 'react';
import type { EventSearchCriteria } from '@store/event/models';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAFormActions } from '@abgov/react-components/experimental';

const initCriteria: EventSearchCriteria = {
  namespace: '',
  name: '',
  timestampMax: '',
  timestampMin: '',
};

interface EventSearchFormProps {
  initialValue?: EventSearchCriteria;
  onCancel?: () => void;
  onSearch?: (searchCriteria: EventSearchCriteria) => void;
}

export const EventSearchForm: FunctionComponent<EventSearchFormProps> = ({ onCancel, onSearch }) => {
  const [searchCriteria, setSearchCriteria] = useState(initCriteria);
  const today = new Date().toLocaleDateString().split('/').reverse().join('-');
  return (
    <GoAForm>
      <GoAFormItem>
        <label>Maximum Timestamp</label>
        <input
          type="datetime-local"
          name="TimeStampMin"
          max={today}
          value={searchCriteria.timestampMax}
          onChange={(e) => setSearchCriteria({ ...searchCriteria, timestampMax: e.target.value })}
        />
      </GoAFormItem>
      <GoAFormItem>
        <label>Minimum Timestamp</label>
        <input
          type="datetime-local"
          name="TimeStampMax"
          max={today}
          value={searchCriteria.timestampMin}
          onChange={(e) => setSearchCriteria({ ...searchCriteria, timestampMin: e.target.value })}
        />
      </GoAFormItem>

      <GoAFormItem>
        <label>Namespace</label>
        <input
          type="input"
          name="namespace"
          value={searchCriteria.namespace}
          onChange={(e) => setSearchCriteria({ ...searchCriteria, namespace: e.target.value })}
        />
      </GoAFormItem>
      <GoAFormItem>
        <label>Name</label>
        <input
          type="input"
          name="name"
          value={searchCriteria.name}
          onChange={(e) => setSearchCriteria({ ...searchCriteria, name: e.target.value })}
        />
      </GoAFormItem>
      <GoAFormActions>
        <GoAButton
          buttonType="tertiary"
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            setSearchCriteria(initCriteria);
            onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          buttonType="primary"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            onSearch(searchCriteria);
          }}
        >
          Search
        </GoAButton>
      </GoAFormActions>
    </GoAForm>
  );
};
