import axios from 'axios';
import type { Logger } from 'winston';
import { AdspId, assertAdspId } from '../utils';

/**
 * Interface to the token provider for retrieving a service account access token.
 *
 * @export
 * @interface TokenProvider
 */
export interface TokenProvider {
  /**
   * Retrieves an access token using the service's client credentials.
   *
   * The access token is cached and token request is made on cache miss or if the token is near expiry.
   *
   * @returns {Promise<string>}
   * @memberof TokenProvider
   */
  getAccessToken(): Promise<string>;
}

export class TokenProviderImpl implements TokenProvider {
  private readonly LOG_CONTEXT = { context: 'TokenProvider' };

  #token: string;
  #expiry: number;

  constructor(
    private logger: Logger,
    private serviceId: AdspId,
    private clientSecret: string,
    private accessServiceUrl: URL,
    private realm = 'core'
  ) {
    assertAdspId(serviceId, null, 'service');
  }

  getAccessToken = async (): Promise<string> => {
    if (this.#token && Date.now() < this.#expiry) {
      this.logger.debug(`Using existing access token...'`, this.LOG_CONTEXT);

      return this.#token;
    } else {
      const authUrl = new URL(`/auth/realms/${this.realm}/protocol/openid-connect/token`, this.accessServiceUrl);
      this.logger.debug(`Requesting access token from ${authUrl}...'`, this.LOG_CONTEXT);

      try {
        const { data } = await axios.post<{ access_token: string; expires_in: number }>(
          authUrl.href,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.serviceId.toString(),
            client_secret: this.clientSecret,
          })
        );

        // Store token and expiry (with 60 sec dead-band)
        this.#token = data.access_token;
        this.#expiry = Date.now() + (data.expires_in - 60) * 1000;

        this.logger.debug(`Retrieved and cached access token.`, this.LOG_CONTEXT);

        return data.access_token;
      } catch (err) {
        this.logger.error(`Error encountered retrieving access token. ${err}`, this.LOG_CONTEXT);
        throw err;
      }
    }
  };
}
