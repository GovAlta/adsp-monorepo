import { AdspId, ServiceRole } from '@abgov/adsp-service-sdk';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../environments/environment';

export const createPlatformServiceConfig = (
  serviceId: AdspId,
  ...roles: ServiceRole[]
): { client: ClientRepresentation; clientRoles: RoleRepresentation[] } => {
  const client: ClientRepresentation = {
    id: uuidv4(),
    clientId: serviceId.toString(),
    description: `Bearer client containing roles for access to ${serviceId.service}`,
    bearerOnly: true,
    publicClient: false,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    standardFlowEnabled: false,
  };

  const clientRoles: RoleRepresentation[] = roles.map((r) => ({
    name: r.role,
    description: r.description,
  }));

  return {
    client,
    clientRoles,
  };
};

export const createWebappClientConfig = (id: string): ClientRepresentation => {
  const config: ClientRepresentation = {
    id,
    clientId: environment.TENANT_WEB_APP_CLIENT_ID,
    publicClient: true,
    directAccessGrantsEnabled: false,
    redirectUris: [`${environment.TENANT_WEB_APP_HOST}/*`],
    webOrigins: [environment.TENANT_WEB_APP_HOST],
    description: 'Client created by platform team to support the frontend. Please do not delete it',
    protocolMappers: [
      {
        name: 'tenant-service-aud',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-audience-mapper',
        config: {
          'included.client.audience': 'urn:ads:platform:tenant-service',
          'id.token.claim': 'false',
          'access.token.claim': 'true',
        },
      },
    ],
  };

  return config;
};

export const createSubscriberAppPublicClientConfig = (id: string): ClientRepresentation => {
  const config: ClientRepresentation = {
    id,
    clientId: environment.SUBSCRIBER_APP_CLIENT_ID,
    publicClient: true,
    directAccessGrantsEnabled: false,
    redirectUris: [`${environment.SUBSCRIBER_APP_HOST}/*`],
    webOrigins: [environment.SUBSCRIBER_APP_HOST],
    description: 'Client created by platform team to support the subscriber app. Please do not delete it',
  };

  return config;
};
