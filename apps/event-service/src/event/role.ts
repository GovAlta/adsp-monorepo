export enum EventServiceRoles {
  sender = 'event-sender',
  admin = 'event-admin',
  reader = 'event-reader',
}

// This maps to the configuration services service roles as it used to read
// the event definition
export enum EventServiceConfigurationRoles {
  Reader = 'configuration-reader',
}

// Legacy role from when event log queries went directly to the value service; accepted so existing
// event log readers keep working until tenants are granted event-reader.
export const LEGACY_EVENT_LOG_READER_ROLE = 'urn:ads:platform:value-service:value-reader';
