import axios from 'axios';
import { createLogger, transports } from 'winston';
import { ServiceRegistrarImpl } from '../registration/registration';
import { adspId } from '../utils';
import { AuditAction, auditDefinitions } from './index';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;

describe('named audit catalog registration', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const directory = {
    getServiceUrl: jest.fn(async () => new URL('https://configuration.example.test/configuration/v2')),
    getResourceUrl: jest.fn(),
  };
  const tokenProvider = { getAccessToken: jest.fn(async () => 'test-token') };
  const registrar = new ServiceRegistrarImpl(logger, directory, tokenProvider);
  const action: AuditAction = {
    name: 'case.update',
    version: 1,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'compliance',
  };

  function registration(application: string, actions: Record<string, AuditAction> = { UPDATE: action }) {
    return {
      serviceId: adspId`urn:ads:case-team:${application}`,
      displayName: application,
      description: 'Application catalog registration',
      serviceConfigurations: [
        {
          serviceId: adspId`urn:ads:platform:audit-service`,
          configuration: [
            {
              name: `actions-${application}`,
              operation: 'REPLACE' as const,
              configuration: { kind: 'actionCatalog', application, actions: auditDefinitions(actions) },
            },
          ],
        },
      ],
    };
  }

  beforeEach(() => {
    http.patch.mockReset();
    http.patch.mockResolvedValue({ data: {} });
  });

  it('replaces only the document named for serviceId.service', async () => {
    await registrar.register(registration('case-service'));

    expect(http.patch).toHaveBeenCalledWith(
      'https://configuration.example.test/configuration/v2/configuration/audit-service/actions-case-service',
      {
        operation: 'REPLACE',
        configuration: {
          kind: 'actionCatalog',
          application: 'case-service',
          actions: auditDefinitions({ UPDATE: action }),
        },
      },
      expect.any(Object),
    );
  });

  it('uses independent documents for concurrent application registrations', async () => {
    await Promise.all([
      registrar.register(registration('case-service')),
      registrar.register(registration('payment-service')),
    ]);

    expect(new Set(http.patch.mock.calls.map(([url]) => url))).toEqual(
      new Set([
        'https://configuration.example.test/configuration/v2/configuration/audit-service/actions-case-service',
        'https://configuration.example.test/configuration/v2/configuration/audit-service/actions-payment-service',
      ]),
    );
  });

  it('re-registers an empty map without merging removed actions back in', async () => {
    await registrar.register(registration('case-service', {}));

    expect(http.patch.mock.calls[0][1]).toEqual({
      operation: 'REPLACE',
      configuration: { kind: 'actionCatalog', application: 'case-service', actions: {} },
    });
  });

  it('keeps UPDATE as the default for existing named registrations', async () => {
    const input = registration('case-service');
    delete input.serviceConfigurations[0].configuration[0].operation;

    await registrar.register(input);

    expect(http.patch.mock.calls[0][1]).toMatchObject({ operation: 'UPDATE', update: { application: 'case-service' } });
  });

  it('replaces the action catalog from auditActions', async () => {
    await registrar.register({
      serviceId: adspId`urn:ads:case-team:case-service`,
      displayName: 'Case service',
      description: 'Application catalog registration',
      auditActions: [action],
    });

    expect(http.patch).toHaveBeenCalledWith(
      'https://configuration.example.test/configuration/v2/configuration/audit-service/actions-case-service',
      {
        operation: 'REPLACE',
        configuration: { kind: 'actionCatalog', application: 'case-service', actions: auditDefinitions([action]) },
      },
      expect.any(Object),
    );
  });

  it('rejects duplicate auditActions without registering them', async () => {
    await expect(
      registrar.register({
        serviceId: adspId`urn:ads:case-team:case-service`,
        displayName: 'Case service',
        description: 'Application catalog registration',
        auditActions: [action, action],
      }),
    ).rejects.toThrow('Duplicate');
    expect(http.patch).not.toHaveBeenCalled();
  });

  it('registers useNamespace schemas under audit-service rather than platform:audit-service', async () => {
    await registrar.register({
      serviceId: adspId`urn:ads:platform:audit-service`,
      displayName: 'Audit service',
      description: 'Action catalogs',
      configuration: { useNamespace: true, description: 'Catalog schema', schema: { type: 'object' } },
    });

    expect(http.patch.mock.calls[0][1]).toEqual({
      operation: 'UPDATE',
      update: { 'audit-service': { description: 'Catalog schema', configurationSchema: { type: 'object' } } },
    });
  });
});
