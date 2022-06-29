import React, { useEffect, useState } from 'react';
import { fetchServiceRoles, fetchKeycloakServiceRoles } from '@store/access/actions';
import { ConfigServiceRole, Events } from '@store/access/models';
import { useDispatch, useSelector } from 'react-redux';
import { ServiceRoleList } from './serviceRoleList';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { NoItem, ServiceRoleListContainer } from '../styled-component';
import { PageIndicator } from '@components/Indicator';
import { ConfirmationModal } from './addRoleModal';

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

export const selectKeycloakServiceRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.keycloak || {};
  }
);

const RenderNoItem = (): JSX.Element => {
  return (
    <NoItem>
      <p>No client found</p>
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
  const [newClientId, setNewClientId] = useState<string>(null);
  const [newRole, setNewRole] = useState<string>(null);
  const updateState: Record<string, string> | null = useSelector((state: RootState) => {
    const loadingStates = state?.session?.loadingStates;

    const index = loadingStates.findIndex((s) => {
      return s.name === Events.update;
    });
    if (index !== -1 && loadingStates[index].state === 'start') {
      return loadingStates[index].data;
    } else {
      return {};
    }
  });
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  // eslint-disable-next-line
  useEffect(() => {}, [updateState]);

  useEffect(() => {
    if (Object.entries(coreRoles).length === 0) {
      dispatch(fetchServiceRoles());
      dispatch(fetchKeycloakServiceRoles());
    }
  }, []);

  return (
    <div>
      {newClientId && (
        <ConfirmationModal
          clientId={newClientId}
          role={newRole}
          onCancel={() => {
            setNewClientId(null);
          }}
        />
      )}
      {!indicator.show && tenantRoles !== null && (
        <div>
          {Object.entries(tenantRoles).length > 0 &&
            Object.entries(tenantRoles)
              .filter(([clientId, config]) => {
                const roles = (config as ConfigServiceRole).roles;
                return roles.length > 0;
              })
              .map(([clientId, config]): JSX.Element => {
                const roles = (config as ConfigServiceRole).roles;
                return (
                  <ServiceRoleListContainer key={`tenant-service-role-${clientId}`}>
                    <div
                      className="title"
                      key={`tenant-service-role-id-${clientId}`}
                      data-testid={`tenant-service-role-id-${clientId}`}
                    >
                      {clientId}
                    </div>
                    <ServiceRoleList
                      key={`tenant-service-role-list-${clientId}`}
                      data-testid={`tenant-service-role-list-${clientId}`}
                      roles={roles}
                      clientId={clientId}
                      inProcess={updateState}
                      addRoleFunc={(clientId, role: string) => {
                        setNewClientId(clientId);
                        setNewRole(role);
                      }}
                    />
                  </ServiceRoleListContainer>
                );
              })}
          <h2>Core service roles:</h2>
          {coreRoles !== null && Object.entries(coreRoles).length === 0 && <RenderNoItem />}
          {Object.entries(coreRoles).length > 0 &&
            Object.entries(coreRoles)
              .filter(([clientId, config]) => {
                const roles = (config as ConfigServiceRole).roles;
                return roles.length > 0;
              })
              .map(([clientId, config]): JSX.Element => {
                const roles = (config as ConfigServiceRole).roles;
                return (
                  <ServiceRoleListContainer key={`core-service-role-${clientId}`}>
                    <div
                      className="title"
                      key={`core-service-role-id-${clientId}`}
                      data-testid={`core-service-role-id-${clientId}`}
                    >
                      {clientId}
                    </div>
                    <ServiceRoleList
                      key={`core-service-role-list-${clientId}`}
                      data-testid={`core-service-role-list-${clientId}`}
                      roles={roles}
                      inProcess={updateState}
                      clientId={clientId}
                      addRoleFunc={(clientId, role: string) => {
                        setNewClientId(clientId);
                        setNewRole(role);
                      }}
                    />
                  </ServiceRoleListContainer>
                );
              })}
        </div>
      )}
      <PageIndicator />
    </div>
  );
};
