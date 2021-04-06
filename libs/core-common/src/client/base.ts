/* eslint-disable @typescript-eslint/camelcase */
import * as request from 'request';
import { Logger } from 'winston';
import { TokenRequestProps } from '../keycloak';

export abstract class ServiceClientBase {
  private token: string;
  private expires = 0;

  constructor(public logger: Logger, public tokenProps: TokenRequestProps) {}

  getToken() {
    const toExpire = this.expires - new Date().getTime();
    return this.token && toExpire > 5000
      ? Promise.resolve(this.token)
      : new Promise<string>((resolve, reject) =>
          request(
            this.tokenProps.url,
            {
              method: 'POST',
              form: {
                grant_type: 'client_credentials',
                client_id: this.tokenProps.clientId,
                client_secret: this.tokenProps.clientSecret,
              },
            },
            (err, res, body) => {
              this.logger.debug(`Requesting token from ${this.tokenProps.url}...`);
              if (err) {
                reject(new Error(`Error encountered during request to token service: ${err}`));
              } else if (res.statusCode !== 200) {
                reject(new Error(`Error encountered during request to token service with status ${res.statusCode}`));
              } else {
                const tokenResult = JSON.parse(body);
                this.token = tokenResult['access_token'];
                this.expires = new Date().getTime() + tokenResult['expires'] * 1000;
                resolve(this.token);
              }
            }
          )
        );
  }
}
