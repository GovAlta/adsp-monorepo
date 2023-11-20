import { InvalidValueError } from '@core-services/core-common';
import { RedisClient } from 'redis';
import { Logger } from 'winston';
import { Client, ClientCredentialRepository, ClientCredentials } from './token';
import { createKey, decryptAndDeserialize, serializeAndEncrypt } from './util';

class RedisClientRegistrationRepository implements ClientCredentialRepository {
  private storeSecret: Buffer;
  constructor(private logger: Logger, private client: RedisClient, storeSecret: string, private prefix = 'reg:') {
    this.storeSecret = createKey(storeSecret);
  }

  isConnected(): boolean {
    return this.client.connected;
  }

  get(client: Client): Promise<ClientCredentials> {
    if (!client?.tenantId || !client?.id) {
      throw new InvalidValueError('client ID', 'Client ID cannot be null or empty.');
    }

    const key = this.getKey(client);
    return new Promise((resolve, reject) => {
      this.client.get(key, async (err, result) => {
        if (err) {
          reject(err);
        } else {
          let credentials: ClientCredentials = null;
          if (result) {
            try {
              const value: ClientCredentials = decryptAndDeserialize(this.storeSecret, result);
              credentials = {
                realm: value.realm,
                clientId: value.clientId,
                clientSecret: value.clientSecret,
                registrationUrl: value.registrationUrl,
                registrationToken: value.registrationToken,
              };
            } catch (err) {
              this.logger.warn(`Deserialization of client registration (ID: ${client.id}) failed with error: ${err}`, {
                context: 'RedisClientRegistrationRepository',
                tenant: client.tenantId.toString(),
              });
            }
          }
          resolve(credentials);
        }
      });
    });
  }

  save(client: Client, credentials: ClientCredentials): Promise<ClientCredentials> {
    const key = this.getKey(client);
    return new Promise((resolve, reject) => {
      try {
        const value = serializeAndEncrypt(this.storeSecret, {
          realm: credentials.realm,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          registrationUrl: credentials.registrationUrl,
          registrationToken: credentials.registrationToken,
        });
        this.client.set(key, value, (err) => (err ? reject(err) : resolve(credentials)));
      } catch (err) {
        reject(err);
      }
    });
  }

  private getKey(client: Client) {
    return `${this.prefix}${client.tenantId.resource}${client.id}`;
  }
}

interface RepositoryProps {
  logger: Logger;
  redisClient: RedisClient;
  storeSecret: string;
}

export function createRedisRepository({ logger, redisClient, storeSecret }: RepositoryProps) {
  return new RedisClientRegistrationRepository(logger, redisClient, storeSecret);
}
