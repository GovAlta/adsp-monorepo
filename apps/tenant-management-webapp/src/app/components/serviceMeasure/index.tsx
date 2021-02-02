import React from 'react';
import BaseApp from '../../baseApp';
import { useDispatch } from 'react-redux';
import { getUptime } from '../../../actions';
import { useSelector } from 'react-redux'

function ServiceMeasure() {
  const tenantManagement = useSelector(state => state.tenantManagement);
  const dispatch = useDispatch();

  return (
    <BaseApp>
      <h2>Future Service Measures</h2>
      <button onClick={() => dispatch(getUptime())} >Refresh Uptime</button>
      <div>Tenant Management Api Uptime: {tenantManagement.uptime} seconds</div>
    </BaseApp>
  );
}

export default ServiceMeasure;
