import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  serviceAccountClientId: string;
  clientRoles: Record<string, string[]>;
}

interface Client {
  id: string;
  clientId: string;
  secret: string;
  protocolMappers: { id: string }[];
}

interface ClientRole {
  id: string;
  name: string;
  description: string;
  composite: false;
  clientRole: true;
  containerId: string;
}

export interface RealmConfiguration {
  roles: {
    client: Record<string, ClientRole[]>;
  };
  users: User[];
  clients: Client[];
}

export function addService(realm: RealmConfiguration, service: string): string {
  const serviceId = `urn:ads:platform:${service}`;

  const fileServiceId = 'urn:ads:platform:file-service';
  const fileServiceUser = realm.users.find((u) => u.serviceAccountClientId === fileServiceId);
  const fileServiceClient = realm.clients.find((c) => c.clientId === fileServiceId);

  const serviceUser: User = {
    ...fileServiceUser,
    id: uuidv4(),
    username: `service-account-${serviceId}`,
    serviceAccountClientId: serviceId,
  };

  const serviceClient: Client = {
    ...fileServiceClient,
    protocolMappers: fileServiceClient.protocolMappers.map((p) => ({ ...p, id: uuidv4() })),
    id: uuidv4(),
    clientId: serviceId,
    secret: uuidv4(),
  };

  realm.roles.client[serviceId] = [];
  realm.users.push(serviceUser);
  realm.clients.push(serviceClient);

  return serviceClient.secret;
}
