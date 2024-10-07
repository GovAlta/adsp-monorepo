import axios from 'axios';
import { ConstantBackoff, handleAll, retry as retryBuilder } from 'cockatiel';
import type { Logger } from 'winston';
import { AdspId, LimitToOne, assertAdspId } from '../utils';

export const retry = retryBuilder(handleAll, { maxAttempts: 1, backoff: new ConstantBackoff(50) });

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
  private readonly TOKEN_URL_OVERRIDE = 'TOKEN_URL';

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

    const override = process.env[this.TOKEN_URL_OVERRIDE];
    if (override) {
      this.accessServiceUrl = new URL(override);

      this.logger.info(
        `Overrode token url with value from env variable ${this.TOKEN_URL_OVERRIDE}: ${override}`,
        this.LOG_CONTEXT
      );
    }
  }

  @LimitToOne()
  async retrieveAccessToken() {
    const authUrl = new URL(`/auth/realms/${this.realm}/protocol/openid-connect/token`, this.accessServiceUrl);
    this.logger.debug(`Requesting access token from ${authUrl}...'`, this.LOG_CONTEXT);

    try {
      const data = await retry.execute(async ({ attempt }) => {
        if (attempt) {
          this.logger.debug(`Retrying retrieval of access token...`, this.LOG_CONTEXT);
        }

        const { data } = await axios.post<{ access_token: string; expires_in: number }>(
          authUrl.href,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.serviceId.toString(),
            client_secret: this.clientSecret,
          })
        );

        return data;
      });

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

  getAccessToken = async (): Promise<string> => {
    if (this.#token && Date.now() < this.#expiry) {
      this.logger.debug(`Using existing access token...'`, this.LOG_CONTEXT);

      return this.#token;
    } else {
      return await this.retrieveAccessToken();
    }
  };
}
