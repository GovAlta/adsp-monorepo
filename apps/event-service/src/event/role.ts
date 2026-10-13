export enum EventServiceRoles {
  sender = 'event-sender',
  admin = 'event-admin',
  reader = 'event-reader',
}

// This maps to the configuration services service roles as it used to read
// the event definition
export enum EventServiceConfigurationRoles {
  Reader = 'urn:ads:platform:configuration-service:configuration-reader',
}

// This maps to the value services service roles as it used to read
// the value service information
export enum EventServiceValueRoles {
  Reader = 'urn:ads:platform:value-service:value-reader',
}
