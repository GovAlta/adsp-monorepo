import { GoACallout } from '@abgov/react-components';
import { Main } from '@components/Html';
import { RootState } from '@store/index';
import { fetchServiceMetrics, fetchServices, setIntervalCriteria, setServiceCriteria } from '@store/metrics/actions';
import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MetricsChart } from './metricsChart';
import { MetricsSearchForm } from './metricsSearchForm';

export const ServiceMetrics: FunctionComponent = () => {
  const readerRole = 'value-reader';
  const hasReaderRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:value-service']?.roles?.includes(readerRole)
  );
  const { service, chartInterval } = useSelector((state: RootState) => state.serviceMetrics.criteria);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchServices());
  });

  return (
    <Main>
      <h1 data-testid="serviceMetrics-title">Service metrics</h1>
      <p>
        Service metrics shows low level response time values benchmarked in service code. Instrument your services to
        collect then send metrics to the value service to see it here.
      </p>
      {hasReaderRole ? (
        <>
          <MetricsSearchForm
            onSearch={() => dispatch(fetchServiceMetrics(service, chartInterval))}
            onReset={() => {
              dispatch(setIntervalCriteria('1 hour'));
              dispatch(setServiceCriteria(null));
            }}
          />
          <br />
          <MetricsChart />
        </>
      ) : (
        <GoACallout
          title="Value reader role required"
          type="information"
          content="You need the urn:ads:platform:value-service 'value-reader' role to see service metrics."
        />
      )}
    </Main>
  );
};
