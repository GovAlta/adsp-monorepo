import { adspId } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';

export type OperationType = 'ACTION' | 'CREATE' | 'DELETE' | 'UPDATE';
export type ResourceType =
  | 'AUTH_EXECUTION'
  | 'AUTH_EXECUTION_FLOW'
  | 'AUTH_FLOW'
  | 'AUTHENTICATOR_CONFIG'
  | 'AUTHORIZATION_POLICY'
  | 'AUTHORIZATION_RESOURCE'
  | 'AUTHORIZATION_RESOURCE_SERVER'
  | 'AUTHORIZATION_SCOPE'
  | 'CLIENT'
  | 'CLIENT_INITIAL_ACCESS_MODEL'
  | 'CLIENT_ROLE'
  | 'CLIENT_ROLE_MAPPING'
  | 'CLIENT_SCOPE'
  | 'CLIENT_SCOPE_CLIENT_MAPPING'
  | 'CLIENT_SCOPE_MAPPING'
  | 'CLUSTER_NODE'
  | 'COMPONENT'
  | 'CUSTOM'
  | 'GROUP'
  | 'GROUP_MEMBERSHIP'
  | 'IDENTITY_PROVIDER'
  | 'IDENTITY_PROVIDER_MAPPER'
  | 'PROTOCOL_MAPPER'
  | 'REALM'
  | 'REALM_ROLE'
  | 'REALM_ROLE_MAPPING'
  | 'REALM_SCOPE_MAPPING'
  | 'REQUIRED_ACTION'
  | 'USER'
  | 'USER_FEDERATION_MAPPER'
  | 'USER_FEDERATION_PROVIDER'
  | 'USER_LOGIN_FAILURE'
  | 'USER_SESSION';

export interface AccessAdminEvent extends DomainEvent {
  payload: {
    resourcePath: string;
    resourceType: ResourceType;
    operationType: OperationType;
  };
}

export const accessApiId = adspId`urn:ads:platform:access-service:v1`;

export function isAdminEvent(event: DomainEvent): event is AccessAdminEvent {
  const { namespace, payload } = event as AccessAdminEvent;
  return (
    namespace === accessApiId.service &&
    typeof payload?.resourcePath === 'string' &&
    typeof payload.operationType === 'string' &&
    typeof payload.resourceType === 'string'
  );
}
