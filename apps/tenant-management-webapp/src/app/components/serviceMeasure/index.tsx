import React from 'react';
import { useDispatch } from 'react-redux';
import { serviceMeasure } from '../../store/actions';
import { useSelector } from 'react-redux';
import { Container } from 'react-bootstrap';

function ServiceMeasure() {
  const tenantManagement = useSelector((state) => state.serviceMeasure);
  const dispatch = useDispatch();

  return (
    <Container>
      <h2>Future Service Measures</h2>
      <button onClick={() => dispatch(serviceMeasure.getUptime())}>
        Refresh Uptime
      </button>
      <div>Tenant Management Api Uptime: {tenantManagement.uptime} seconds</div>
    </Container>
  );
}

export default ServiceMeasure;
