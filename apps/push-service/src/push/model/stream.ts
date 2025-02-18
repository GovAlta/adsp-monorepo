import { AdspId, hasRequiredRole, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError } from '@core-services/core-common';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Logger } from 'winston';
import { PushServiceRoles } from '../roles';
import { EventCriteria, Stream, StreamEvent } from '../types';

export type StreamItem = unknown & Pick<DomainEvent, 'namespace' | 'name' | 'correlationId' | 'context' | 'tenantId'>;
export class StreamEntity implements Stream {
  id: string;
  name: string;
  description: string;
  events: StreamEvent[];
  subscriberRoles: string[];
  publicSubscribe: boolean;

  stream: Observable<StreamItem>;

  constructor(private logger: Logger, public tenantId: AdspId, stream: Stream) {
    this.id = stream.id;
    this.name = stream.name;
    this.description = stream.description;
    this.events = stream.events || [];

    this.subscriberRoles = stream.subscriberRoles || [];
    this.publicSubscribe = stream.publicSubscribe;
  }

  connect(events: Observable<DomainEvent>): StreamEntity {
    if (!this.stream) {
      this.stream = events.pipe(
        map((event) => [
          event,
          this.events.find(
            (se) =>
              (!this.tenantId || event.tenantId.toString() === this.tenantId.toString()) &&
              event.namespace === se.namespace &&
              event.name === se.name &&
              this.isMatch(event, se.criteria)
          ),
        ]),
        filter(([_, streamEvent]) => {
          const hasMatch = !!streamEvent;
          if (hasMatch) {
            this.logger.debug(
              `Matched event ${streamEvent.namespace}:${streamEvent.name} to stream ${this.name} (ID: ${this.id})...`,
              { context: 'StreamEntity', tenant: this.tenantId?.toString() }
            );
          }
          return hasMatch;
        }),
        map(([event, streamEvent]: [DomainEvent, StreamEvent]) => this.mapEvent(event, streamEvent))
      );
    }
    return this;
  }

  public isMatch(event: StreamItem, criteria?: EventCriteria) {
    // Is a match if there is:
    // 1. No criteria; or
    // 2. Not (has correlationId criteria and does not match event correlationId) and
    // 3. Not (has context criteria with any context value that does not match event context).
    return (
      !criteria ||
      (!(criteria.correlationId && criteria.correlationId !== event.correlationId) &&
        !(criteria.context && Object.entries(criteria.context).find(([key, value]) => value !== event.context?.[key])))
    );
  }

  private mapEvent(event: DomainEvent, streamEvent: StreamEvent): StreamItem {
    const item: StreamItem = streamEvent.map
      ? Object.entries(streamEvent.map).reduce((o, [k, p]) => ({ ...o, [k]: _.get(event, p, undefined) }), {
          tenantId: event.tenantId,
          namespace: event.namespace,
          name: event.name,
          correlationId: event.correlationId,
          context: event.context,
        })
      : { ...event };

    return item;
  }

  canSubscribe(user: User): boolean {
    // In case the stream is accessed in a cross-tenant context (no tenantId), then only core users with required role are allowed.
    return this.tenantId
      ? this.publicSubscribe ||
          isAllowedUser(user, this.tenantId, [PushServiceRoles.StreamListener, ...this.subscriberRoles], true)
      : !!(user?.isCore && hasRequiredRole(user, [PushServiceRoles.StreamListener, ...this.subscriberRoles]));
  }

  getEvents(user?: User, criteria?: EventCriteria): Observable<StreamItem> {
    if (!this.canSubscribe(user)) {
      throw new UnauthorizedUserError('access stream', user);
    }

    if (!this.stream) {
      throw new InvalidOperationError('Stream not connected.');
    }

    return this.stream.pipe(
      filter((o) => {
        const isMatch = this.isMatch(o, criteria);
        this.logger.debug(
          `Filtering event ${o.namespace}:${o.name} for subscriber ${user?.name} (ID: ${user?.id})` +
            ` on stream ${this.name} (ID: ${this.id}) with result: ${isMatch}`,
          { context: 'StreamEntity', tenant: this.tenantId?.toString() }
        );
        return isMatch;
      })
    );
  }
}
