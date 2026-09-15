import { GoabDropdown, GoabDropdownItem, GoabFormItem } from '@abgov/react-components';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
import { RootState } from '@store/index';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { reportsPath } from '../paths';
import { getAvailableServiceReports } from '../registry/serviceReportRegistry';

export const ServiceSelector: FunctionComponent = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const featureFlags = useSelector(
    (state: RootState) => (state.config.featureFlags || {}) as Record<string, boolean>
  );
  const reports = getAvailableServiceReports(featureFlags || {});

  const onChange = (detail: GoabDropdownOnChangeDetail) => {
    const nextId = detail.value && detail.value.toString();
    if (!nextId) {
      return;
    }
    navigate(reportsPath(nextId, searchParams.toString()));
  };

  return (
    <GoabFormItem label="Service">
      <GoabDropdown
        name="Service"
        size="compact"
        value={serviceId || ''}
        width="100%"
        testId="reports-service-selector"
        onChange={onChange}
      >
        {reports.map((report) => (
          <GoabDropdownItem key={report.id} value={report.id} label={report.label} />
        ))}
      </GoabDropdown>
    </GoabFormItem>
  );
};
