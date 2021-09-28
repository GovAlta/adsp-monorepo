import { AdspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { New, Results } from '@core-services/core-common';
import { CalendarRepository } from '../repository';
import { CalendarServiceRoles } from '../roles';
import { Calendar, CalendarEvent, CalendarEventCriteria } from '../types';
import { CalendarEventEntity } from './event';

export class CalendarEntity implements Calendar {
  name: string;
  displayName: string;
  description: string;
  updateRoles: string[] = [];
  readRoles: string[] = [];

  constructor(private repository: CalendarRepository, public tenantId: AdspId, calendar: Calendar) {
    this.name = calendar.name;
    this.displayName = calendar.displayName;
    this.description = calendar.description;
    this.readRoles = calendar.readRoles || [];
    this.updateRoles = calendar.updateRoles || [];
  }

  canAccessPrivateEvent(user: User): boolean {
    return (
      user?.tenantId?.toString() === this.tenantId.toString() &&
      (user?.roles?.includes(CalendarServiceRoles.Admin) ||
        !!this.updateRoles.find((r) => user?.roles?.includes(r)) ||
        !!this.readRoles.find((r) => user?.roles?.includes(r)))
    );
  }

  getEvents(
    user: User,
    top: number,
    after?: string,
    criteria?: CalendarEventCriteria
  ): Promise<Results<CalendarEventEntity>> {
    if (!this.canAccessPrivateEvent(user)) {
      criteria = {
        ...(criteria || {}),
        isPublic: true,
      };
    }

    return this.repository.getCalendarEvents(this, top, after, criteria);
  }

  async getEvent(user: User, id: number): Promise<CalendarEventEntity> {
    const event = await this.repository.getCalendarEvent(this, id);
    if (event && !event.isPublic && !this.canAccessPrivateEvent(user)) {
      throw new UnauthorizedUserError('access event', user);
    }

    return event;
  }

  canUpdateEvent(user: User): boolean {
    return (
      user?.tenantId?.toString() === this.tenantId.toString() &&
      (user?.roles?.includes(CalendarServiceRoles.Admin) || !!this.updateRoles.find((r) => user?.roles?.includes(r)))
    );
  }

  createEvent(user: User, event: New<CalendarEvent>): Promise<CalendarEventEntity> {
    if (!this.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('create calendar event', user);
    }

    const entity = new CalendarEventEntity(this.repository, this, { ...event, id: null });
    return this.repository.save(entity);
  }
}
