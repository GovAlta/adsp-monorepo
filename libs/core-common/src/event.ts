export interface DomainEvent {
  namespace: string
  name: string
  timestamp: Date
  correlationId?: string
  [key: string]: unknown
}

export interface DomainEventService {
  isConnected(): boolean
  send(event: DomainEvent): void;
}
