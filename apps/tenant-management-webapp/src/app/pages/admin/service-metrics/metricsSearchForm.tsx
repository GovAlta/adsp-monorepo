import {
  GoabDropdown,
  GoabDropdownItem,
  GoabButton,
  GoabButtonGroup,
  GoabFormItem,
  GoabGrid,
} from '@abgov/react-components';

import { RootState } from '@store/index';
import { setIntervalCriteria, setServiceCriteria } from '@store/metrics/actions';
import { ChartInterval } from '@store/metrics/models';
import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
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
      <GoabGrid gap="s" minChildWidth="30ch">
        <GoabFormItem label="Service">
          <GoabDropdown
            name="Service"
            value={service ? service : ''}
            width="100%"
            onChange={(detail: GoabDropdownOnChangeDetail) =>
              dispatch(setServiceCriteria(detail.value && detail.value.toString()))
            }
          >
            {services &&
              services
                .sort((a, b) => a.localeCompare(b))
                .map((service) => <GoabDropdownItem name="Service" key={service} value={service} label={service} />)}
          </GoabDropdown>
        </GoabFormItem>
        <GoabFormItem label="Time period">
          <GoabDropdown
            name="Time period"
            value={chartInterval}
            onChange={(detail: GoabDropdownOnChangeDetail) =>
              dispatch(setIntervalCriteria(detail.value as ChartInterval))
            }
            width="100%"
          >
            <GoabDropdownItem value="15 mins" label="Last 15 minutes" />
            <GoabDropdownItem value="1 hour" label="Last hour" />
            <GoabDropdownItem value="5 hours" label="Last 5 hours" />
          </GoabDropdown>
        </GoabFormItem>
      </GoabGrid>
      <GoabButtonGroup alignment="end">
        <GoabButton type="secondary" onClick={onReset}>
          Reset
        </GoabButton>

        <GoabButton disabled={!chartInterval || !service} onClick={onSearch}>
          Search
        </GoabButton>
      </GoabButtonGroup>
    </div>
  );
};
