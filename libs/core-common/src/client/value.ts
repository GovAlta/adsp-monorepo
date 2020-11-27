import * as request from 'request';
import { Logger } from 'winston';
import { TokenRequestProps } from '../keycloak';
import { ServiceClientBase } from './base';

export interface Value {
  timestamp: Date
  correlationId?: string
  context?: {
    [key: string]: boolean | string | number
  }
  value: unknown
}

export class ValueServiceClient extends ServiceClientBase {

  constructor(
    logger: Logger, 
    tokenProps: TokenRequestProps,
    private valueUrl: string
  ) {
    super(logger, tokenProps);
  }

  write(namespace: string, name: string, value: Value) {
    return this.tokenProps.clientId ?
    this.getToken()
    .then(token => {
      return new Promise<void>((resolve, reject) => request(
        `${this.valueUrl}/value/v1/${namespace}/values/${name}`,
        { 
          method: 'POST', 
          headers: { 
            'Authorization': `Bearer ${token}`
          },
          json: value
        }, 
        (err, res) => {
          if (err) {
            reject(new Error(`Error encountered during request to event service: ${err}`));
          } else if (res.statusCode !== 200) {
            reject(new Error(`Error encountered during request to event service with status ${res.statusCode}`));
          } else {
            resolve();
          }
        }
      ))
    })
    .catch(err => {
      this.logger.error(`Error encountered sending event: ${err}`);
    }) :
    Promise.resolve();
  }
}
