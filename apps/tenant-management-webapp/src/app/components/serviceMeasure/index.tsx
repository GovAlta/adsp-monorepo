import React from 'react';
import BaseApp from '../../baseApp';
import { useDispatch } from 'react-redux';
import { serviceMeasure } from '../../store/actions';
import { useSelector } from 'react-redux';

function ServiceMeasure() {
  const tenantManagement = useSelector((state) => state.serviceMeasure);
  const dispatch = useDispatch();

  return (
    <BaseApp>
      <h2>Future Service Measures</h2>
      <button onClick={() => dispatch(serviceMeasure.getUptime())}>
        Refresh Uptime
      </button>
      <div>Tenant Management Api Uptime: {tenantManagement.uptime} seconds</div>
    </BaseApp>
  );
}

export default ServiceMeasure;
