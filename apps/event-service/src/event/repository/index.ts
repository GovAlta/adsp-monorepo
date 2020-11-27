import { EventRepository } from './event';

export * from './event';

export interface Repositories {
  eventRepository: EventRepository
  isConnected(): boolean
}
