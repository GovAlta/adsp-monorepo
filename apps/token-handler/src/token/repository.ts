import { Client, ClientCredentials } from './types';

export interface ClientCredentialRepository {
  get(client: Client): Promise<ClientCredentials>;
  save(client: Client, credentials: ClientCredentials): Promise<ClientCredentials>;
}
