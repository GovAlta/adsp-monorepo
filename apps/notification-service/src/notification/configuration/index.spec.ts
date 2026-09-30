import * as configuration from '.';

describe('configuration', () => {
  it('exports the configuration, schema, type definition checks, and writer', () => {
    expect(configuration.NotificationConfiguration).toBeTruthy();
    expect(configuration.configurationSchema).toBeTruthy();
    expect(configuration.validateNotificationType).toBeTruthy();
    expect(configuration.toNotificationTypeDefinition).toBeTruthy();
    expect(configuration.NotificationConfigurationWriter).toBeTruthy();
  });
});
