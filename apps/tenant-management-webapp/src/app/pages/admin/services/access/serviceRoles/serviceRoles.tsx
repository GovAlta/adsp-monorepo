import React, { useEffect } from 'react';
import { fetchServiceRoles } from '@store/access/actions';
import { ConfigServiceRole } from '@store/access/models';

import { useDispatch, useSelector } from 'react-redux';
import { ServiceRoleList } from './serviceRoleList';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { NoItem, ServiceRoleListContainer, NoServiceRole } from '../styled-component';
import { PageIndicator } from '@components/Indicator';

export const selectServiceTenantRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.tenant || {};
  }
);

export const selectServiceCoreRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.core || {};
  }
);

const RenderNoItem = (): JSX.Element => {
  return (
    <NoItem>
      <p>No client found</p>
    </NoItem>
  );
};
const RenderNoServiceRole = (): JSX.Element => {
  return (
    <NoServiceRole>
      <p>No service roles found</p>
    </NoServiceRole>
  );
};

export const ServiceRoles = (): JSX.Element => {
  const dispatch = useDispatch();
  const tenantRoles = useSelector(selectServiceTenantRoles);
  const coreRoles = useSelector(selectServiceCoreRoles);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);
  useEffect(() => {
    dispatch(fetchServiceRoles());
  }, []);
  return (
    <div>
      {!indicator.show && tenantRoles !== null && (
        <div>
          <h2>{tenantName} service roles:</h2>
          {Object.entries(tenantRoles).length === 0 && <RenderNoItem />}
          {Object.entries(tenantRoles).length > 0 &&
            Object.entries(tenantRoles).map(([clientId, config]): JSX.Element => {
              const roles = (config as ConfigServiceRole).roles;

              return (
                <ServiceRoleListContainer key={`tenant-service-role-${clientId}`}>
                  <div className="title" key={`tenant-service-role-id-${clientId}`}>
                    {clientId}
                  </div>
                  {roles.length === 0 && <RenderNoServiceRole key={`core-service-role-list-${clientId}`} />}
                  {roles.length > 0 && <ServiceRoleList key={`core-service-role-list-${clientId}`} roles={roles} />}
                </ServiceRoleListContainer>
              );
            })}
          <h2>Core service roles:</h2>
          {Object.entries(coreRoles).length === 0 && <RenderNoItem />}
          {Object.entries(coreRoles).length > 0 &&
            Object.entries(coreRoles).map(([clientId, config]): JSX.Element => {
              const roles = (config as ConfigServiceRole).roles;
              return (
                <ServiceRoleListContainer key={`core-service-role-${clientId}`}>
                  <div className="title" key={`core-service-role-id-${clientId}`}>
                    {clientId}
                  </div>
                  {roles.length === 0 && <RenderNoServiceRole key={`core-service-role-list-${clientId}`} />}
                  {roles.length > 0 && <ServiceRoleList key={`core-service-role-list-${clientId}`} roles={roles} />}
                </ServiceRoleListContainer>
              );
            })}
        </div>
      )}
      <PageIndicator />
    </div>
  );
};
