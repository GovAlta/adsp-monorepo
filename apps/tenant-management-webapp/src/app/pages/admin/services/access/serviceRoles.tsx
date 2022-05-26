import React, { useEffect } from 'react';
import { fetchServiceRoles } from '@store/access/actions';
import { useDispatch, useSelector } from 'react-redux';
import { ServiceRoleList } from './serviceRoleList';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { NoItem, NameDiv } from './styled-component';
import { PageIndicator } from '@components/Indicator';

export const selectServiceTenantRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.tenant;
  }
);

export const selectServiceCoreRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.core;
  }
);

const RenderNoItem = (): JSX.Element => {
  return (
    <NoItem>
      <p>No service roles found</p>
    </NoItem>
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
    <>
      {!indicator.show && tenantRoles !== null && (
        <div>
          <NameDiv>{tenantName}</NameDiv>
          {tenantRoles.length === 0 && <RenderNoItem />}
          {tenantRoles.length > 0 && <ServiceRoleList roles={tenantRoles} />}
          <NameDiv>Core</NameDiv>
          {coreRoles.length === 0 && <RenderNoItem />}
          {coreRoles.length > 0 && <ServiceRoleList roles={coreRoles} />}
        </div>
      )}
      <PageIndicator />
    </>
  );
};
