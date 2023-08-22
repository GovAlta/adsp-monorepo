import { createLoggerMessage, AdspLoggerOpts } from './logging';
import 'core-js';
describe('Test logger default functions', () => {
  const baseOpts = {
    service: 'mock-service',
    timestamp: '2023-08-22T19:18:50.816Z',
  };
  it('Can log without options', () => {
    expect(createLoggerMessage(baseOpts)).toBe('');
  });

  it('Can create log message with tenant id', () => {
    const loggerOpts: AdspLoggerOpts = {
      ...baseOpts,
      tenantId: 'urn:platform:tenant:mock-tenant',
    };

    expect(createLoggerMessage(loggerOpts)).toBe('[urn:platform:tenant:mock-tenant]');
  });

  it('Can create log message with tenant id, and service name', () => {
    const loggerOpts: AdspLoggerOpts = {
      ...baseOpts,
      tenantId: 'urn:platform:tenant:mock-tenant',
      showService: true,
    };

    expect(createLoggerMessage(loggerOpts)).toBe('[mock-service][urn:platform:tenant:mock-tenant]');
  });

  it('Can create log message with tenant id, service name and jobId', () => {
    const loggerOpts: AdspLoggerOpts = {
      ...baseOpts,
      tenantId: 'urn:platform:tenant:mock-tenant',
      showService: true,
      jobId: '1234',
    };

    expect(createLoggerMessage(loggerOpts)).toBe('[mock-service][urn:platform:tenant:mock-tenant][1234]');
  });

  it('Can create log message with message', () => {
    const loggerOpts: AdspLoggerOpts = {
      ...baseOpts,
      tenantId: 'urn:platform:tenant:mock-tenant',
      showService: true,
      jobId: '1234',
      message: 'mock message',
    };

    expect(createLoggerMessage(loggerOpts)).toBe('[mock-service][urn:platform:tenant:mock-tenant][1234] mock message');
  });
});
