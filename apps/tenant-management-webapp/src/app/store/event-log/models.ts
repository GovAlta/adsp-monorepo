export interface EventLogEntry {
  namespace: string;
  name: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

export interface EventLogState {
  entries: EventLogEntry[];
  next: string;
  isLoading: boolean;
}
