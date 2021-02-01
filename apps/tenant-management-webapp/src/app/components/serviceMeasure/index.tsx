import React, { useState, useEffect } from 'react';
import BaseApp from '../../baseApp';
import { connect } from 'react-redux';
import { getUptime } from '../../../actions';
import { useSelector } from 'react-redux'

function ServiceMeasure({ dispatch}) {
  const tenantManagement = useSelector(state => state.tenantManagement);

  return (
    <BaseApp>
      <h2>Future Service Measures</h2>
      <button onClick={() => dispatch(getUptime())} >Refresh Uptime</button>
      <div>Tenant Management Api Uptime: {tenantManagement.uptime} seconds</div>
    </BaseApp>
  );
}

export default connect(null)(ServiceMeasure);
