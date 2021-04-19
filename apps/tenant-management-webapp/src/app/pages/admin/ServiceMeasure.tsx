import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ApiUptimeFetch } from '@store/api-status/actions';
import { RootState } from '@store/index';
import Container from '@components/Container';

function ServiceMeasure() {
  const apiStatus = useSelector((state: RootState) => state.apiStatus);
  const dispatch = useDispatch();

  return (
    <Container>
      <h1>Future Service Measures</h1>
      <button onClick={() => dispatch(ApiUptimeFetch())}>Refresh Uptime</button>
      {apiStatus.status === 'loaded' && <div>Tenant Management Api Uptime: {apiStatus.uptime} seconds</div>}
    </Container>
  );
}

export default ServiceMeasure;
