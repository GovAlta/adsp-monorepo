import React from 'react';
import { useDispatch } from 'react-redux';
import { ApiUptimeFetch } from '@store/api-status/actions';
import { useSelector } from 'react-redux';
import { Container } from 'react-bootstrap';
import { RootState } from '@store/index';

function ServiceMeasure() {
  const apiStatus = useSelector((state: RootState) => state.apiStatus);
  const dispatch = useDispatch();

  return (
    <Container>
      <h2>Future Service Measures</h2>
      <button onClick={() => dispatch(ApiUptimeFetch())}>Refresh Uptime</button>
      {apiStatus.status === "loaded" && (
        <div>Tenant Management Api Uptime: {apiStatus.uptime} seconds</div>
      )}
    </Container>
  );
}

export default ServiceMeasure;
