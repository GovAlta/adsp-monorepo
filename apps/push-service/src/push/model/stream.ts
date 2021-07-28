import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import type { User } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError, New, UnauthorizedError, Update } from '@core-services/core-common';
import { EventCriteria, Stream, StreamEvent } from '../types';
import { StreamRepository } from '../repository';
import { PushSpaceEntity } from './space';

export class StreamEntity implements Stream {
  spaceId: string;
  id: string;
  name: string;
  events: StreamEvent[];
  subscriberRoles: string[];

  stream: Observable<unknown & Pick<DomainEvent, 'correlationId' | 'context'>>;

  static create(
    repository: StreamRepository,
    space: PushSpaceEntity,
    id: string,
    stream: New<Stream>
  ): Promise<StreamEntity> {
    return repository.save(new StreamEntity(repository, space, { ...stream, spaceId: space.id, id }));
  }

  constructor(private repository: StreamRepository, public space: PushSpaceEntity, stream: Stream) {
    this.id = stream.id;
    this.spaceId = stream.spaceId;
    this.name = stream.name;
    this.events = stream.events;
    this.subscriberRoles = stream.subscriberRoles;
  }

  connect(events: Observable<DomainEvent>): StreamEntity {
    if (!this.stream) {
      this.stream = events.pipe(
        map((event) => [
          event,
          this.events.find(
            (se) => event.namespace === se.namespace && event.name === se.name && this.isMatch(event, se.criteria)
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

  private mapEvent(event: DomainEvent, streamEvent: StreamEvent) {
    return streamEvent.map
      ? Object.entries(streamEvent.map).reduce((o, [k, p]) => ({ ...o, [k]: _.get(event, p, undefined) }), {
          correlationId: event.correlationId,
          context: event.context,
        })
      : { ...event };
  }

  canAccess(user: User): boolean {
    return this.space.canAccess(user);
  }

  canSubscribe(user: User): boolean | string {
    return user && user.roles && user.roles.find((r) => this.subscriberRoles.includes(r));
  }

  canUpdate(user: User): boolean {
    return this.space.canUpdate(user);
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

  update(user: User, update: Update<Stream>): Promise<StreamEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update stream.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.subscriberRoles) {
      this.subscriberRoles = update.subscriberRoles;
    }

    if (update.events) {
      this.events = update.events;
    }

    return this.repository.save(this);
  }

  delete(user: User): Promise<boolean> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to delete stream.');
    }

    return this.repository.delete(this);
  }
}
