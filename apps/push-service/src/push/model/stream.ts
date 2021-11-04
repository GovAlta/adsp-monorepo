import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import { EventCriteria, Stream, StreamEvent } from '../types';

export class StreamEntity implements Stream {
  id: string;
  name: string;
  description: string;
  events: StreamEvent[];
  subscriberRoles: string[];
  publicSubscribe: boolean;

  stream: Observable<unknown & Pick<DomainEvent, 'correlationId' | 'context'>>;

  constructor(public tenantId: AdspId, stream: Stream) {
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
              event.tenantId.toString() === this.tenantId.toString() &&
              event.namespace === se.namespace &&
              event.name === se.name &&
              this.isMatch(event, se.criteria)
          ),
        ]),
        filter(([_, streamEvent]) => !!streamEvent),
        map(([event, streamEvent]: [DomainEvent, StreamEvent]) => this.mapEvent(event, streamEvent))
      );
    }
    return this;
  }

  private isMatch(event: Pick<DomainEvent, 'correlationId' | 'context'>, criteria?: EventCriteria) {
    return (
      !criteria ||
      (!(criteria.correlationId && criteria.correlationId !== event.correlationId) &&
        !(criteria.context && !_.isEqual(criteria.context, event.context)))
    );
  }

  private mapEvent({ tenantId: _tenantId, ...event}: DomainEvent, streamEvent: StreamEvent) {
    return streamEvent.map
      ? Object.entries(streamEvent.map).reduce((o, [k, p]) => ({ ...o, [k]: _.get(event, p, undefined) }), {
          correlationId: event.correlationId,
          context: event.context,
        })
      : { ...event };
  }

  canSubscribe(user: User): boolean {
    return this.publicSubscribe || isAllowedUser(user, this.tenantId, this.subscriberRoles);
  }

  getEvents(user: User, criteria?: EventCriteria): Observable<Pick<DomainEvent, 'correlationId' | 'context'>> {
    if (!this.canSubscribe(user)) {
      throw new UnauthorizedError('User not authorized to access stream.');
    }

    if (!this.stream) {
      throw new InvalidOperationError('Stream not connected.');
    }

    return this.stream.pipe(filter((o) => this.isMatch(o, criteria)));
  }
}
