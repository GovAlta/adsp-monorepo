import * as request from 'request';
import { Logger } from 'winston';
import { TokenRequestProps } from '../keycloak';
import { DomainEvent } from '../event';
import { ServiceClientBase } from './base';

export class EventServiceClient extends ServiceClientBase {
  
  constructor(
    logger: Logger, 
    tokenProps: TokenRequestProps, 
    private eventUrl: string
  ) {
    super(logger, tokenProps);
  }

  send(event: DomainEvent): Promise<void> {
    return this.tokenProps.clientId ?
      this.getToken()
      .then(token => {
        this.logger.debug(
          `Sending event ${event.namespace}:${event.name} to ${this.eventUrl}/event/v1/event...`
        )

        return new Promise<void>((resolve, reject) => request(
          `${this.eventUrl}/event/v1/event`,
          { 
            method: 'POST', 
            headers: { 
              'Authorization': `Bearer ${token}`
            },
            json: event
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
