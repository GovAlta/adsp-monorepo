import { GoADropdown, GoADropdownItem, GoAButton, GoAButtonGroup, GoAFormItem, GoAGrid } from '@abgov/react-components';

import { RootState } from '@store/index';
import { setIntervalCriteria, setServiceCriteria } from '@store/metrics/actions';
import { ChartInterval } from '@store/metrics/models';
import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface MetricsSearchFormProps {
  onSearch: () => void;
  onReset: () => void;
}
export const MetricsSearchForm: FunctionComponent<MetricsSearchFormProps> = ({ onSearch, onReset }) => {
  const services = useSelector((state: RootState) => state.serviceMetrics.services);
  const { service, chartInterval } = useSelector((state: RootState) => state.serviceMetrics.criteria);
  const dispatch = useDispatch();
  return (
    <div>
      <GoAGrid gap="s" minChildWidth="30ch">
        <GoAFormItem label="Service">
          <GoADropdown
            name="Service"
            value={service ? service : ''}
            width="100%"
            relative={true}
            onChange={(_n: string, value: string | string[]) => dispatch(setServiceCriteria(value.toString()))}
          >
            {services &&
              services
                .sort((a, b) => a.localeCompare(b))
                .map((service) => <GoADropdownItem name="Service" key={service} value={service} label={service} />)}
          </GoADropdown>
        </GoAFormItem>
        <GoAFormItem label="Time period">
          <GoADropdown
            name="Time period"
            value={chartInterval}
            onChange={(_n: string, value: string | string[]) => dispatch(setIntervalCriteria(value as ChartInterval))}
            width="100%"
            relative={true}
          >
            <GoADropdownItem value="15 mins" label="Last 15 minutes" />
            <GoADropdownItem value="1 hour" label="Last hour" />
            <GoADropdownItem value="5 hours" label="Last 5 hours" />
          </GoADropdown>
        </GoAFormItem>
      </GoAGrid>
      <GoAButtonGroup alignment="end">
        <GoAButton type="secondary" onClick={onReset}>
          Reset
        </GoAButton>

        <GoAButton disabled={!chartInterval || !service} onClick={onSearch}>
          Search
        </GoAButton>
      </GoAButtonGroup>
    </div>
  );
};
