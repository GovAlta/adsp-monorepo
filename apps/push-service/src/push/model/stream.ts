import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError } from '@core-services/core-common';
import { EventCriteria, Stream, StreamEvent } from '../types';
import { PushServiceRoles } from '..';

type StreamItem = unknown & Pick<DomainEvent, 'namespace' | 'name' | 'correlationId' | 'context'>;
export class StreamEntity implements Stream {
  id: string;
  name: string;
  description: string;
  events: StreamEvent[];
  subscriberRoles: string[];
  publicSubscribe: boolean;

  stream: Observable<StreamItem>;

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

  private isMatch(event: StreamItem, criteria?: EventCriteria) {
    return (
      !criteria ||
      (!(criteria.correlationId && criteria.correlationId !== event.correlationId) &&
        !(criteria.context && !_.isEqual(criteria.context, event.context)))
    );
  }

  private mapEvent({ tenantId: _tenantId, ...event }: DomainEvent, streamEvent: StreamEvent): StreamItem {
    return streamEvent.map
      ? Object.entries(streamEvent.map).reduce((o, [k, p]) => ({ ...o, [k]: _.get(event, p, undefined) }), {
          namespace: event.namespace,
          name: event.name,
          correlationId: event.correlationId,
          context: event.context,
        })
      : { ...event };
  }

  canSubscribe(user: User): boolean {
    return (
      this.publicSubscribe ||
      isAllowedUser(user, this.tenantId, [PushServiceRoles.StreamListener, ...this.subscriberRoles], true)
    );
  }

  getEvents(user: User, criteria?: EventCriteria): Observable<StreamItem> {
    if (!this.canSubscribe(user)) {
      throw new UnauthorizedUserError('access stream', user);
    }

    if (!this.stream) {
      throw new InvalidOperationError('Stream not connected.');
    }

    return this.stream.pipe(filter((o) => this.isMatch(o, criteria)));
  }
}
