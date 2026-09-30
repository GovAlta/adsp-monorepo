import { adspId, Channel, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { ServiceUserRoles } from '../types';
import {
  createNotificationType,
  deleteNotificationType,
  getContact,
  getNotificationTypeDefinitions,
  updateContact,
  updateNotificationType,
} from './configuration';

describe('configuration router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const admin = { id: 'admin', tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User;
  const plain = { id: 'plain', tenantId, roles: [] } as User;

  const writerMock = { update: jest.fn(), delete: jest.fn() };

  const tenantType = {
    id: 'tenant-type',
    name: 'Tenant type',
    description: '',
    publicSubscribe: false,
    subscriberRoles: [],
    channels: [Channel.email],
    events: [],
  };
  const coreType = { ...tenantType, id: 'core-type', name: 'Core type' };
  const configurationMock = {
    contact: { contactEmail: 'support@test.co', phoneNumber: '7801234567', supportInstructions: 'Call us.' },
    email: { fromEmail: 'noreply@test.co' },
    getNotificationType: jest.fn(),
    getTenantDefinitions: jest.fn(() => [tenantType]),
    getTenantDefinition: jest.fn((id: string) => (id === tenantType.id ? tenantType : undefined)),
    getCoreDefinitions: jest.fn(() => [coreType]),
    getCoreDefinition: jest.fn((id: string) => (id === coreType.id ? coreType : undefined)),
  };

  const createRequest = (user: User, extra: Record<string, unknown> = {}) =>
    ({
      user,
      tenant: { id: tenantId },
      query: {},
      params: {},
      body: {},
      getConfiguration: jest.fn().mockResolvedValue(configurationMock),
      ...extra,
    }) as unknown as Request;
  const createResponse = () => {
    const res = { json: jest.fn(), status: jest.fn() };
    res.status.mockReturnValue(res);
    return res as unknown as Response & { json: jest.Mock; status: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationTypeDefinitions', () => {
    it('passes the request on without a source', async () => {
      const next = jest.fn();
      const res = createResponse();
      await getNotificationTypeDefinitions(createRequest(plain), res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('responds with tenant definitions', async () => {
      const res = createResponse();
      await getNotificationTypeDefinitions(createRequest(admin, { query: { source: 'tenant' } }), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith([tenantType]);
    });

    it('responds with core definitions', async () => {
      const res = createResponse();
      await getNotificationTypeDefinitions(createRequest(admin, { query: { source: 'core' } }), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith([coreType]);
    });

    it('rejects a user without subscription-admin', async () => {
      const next = jest.fn();
      await getNotificationTypeDefinitions(
        createRequest(plain, { query: { source: 'tenant' } }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('createNotificationType', () => {
    const newType = { ...tenantType, id: 'new-type', sortedChannels: ['email'] };

    it('saves the type definition', async () => {
      const res = createResponse();
      const next = jest.fn();
      await createNotificationType(writerMock as never)(createRequest(admin, { body: newType }), res, next);

      const { sortedChannels: _sortedChannels, ...definition } = newType;
      expect(writerMock.update).toHaveBeenCalledWith(tenantId, { 'new-type': definition });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(definition);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects a type that already exists with 409', async () => {
      configurationMock.getNotificationType.mockReturnValueOnce({});
      const next = jest.fn();
      await createNotificationType(writerMock as never)(
        createRequest(admin, { body: newType }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ extra: { statusCode: 409 } }));
      expect(writerMock.update).not.toHaveBeenCalled();
    });

    it('rejects an invalid type', async () => {
      const next = jest.fn();
      await createNotificationType(writerMock as never)(
        createRequest(admin, { body: { ...newType, channels: [] } }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(writerMock.update).not.toHaveBeenCalled();
    });

    it('rejects a user without subscription-admin', async () => {
      const next = jest.fn();
      await createNotificationType(writerMock as never)(
        createRequest(plain, { body: newType }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('updateNotificationType', () => {
    it('updates a tenant type with the changed fields', async () => {
      const res = createResponse();
      await updateNotificationType(writerMock as never)(
        createRequest(admin, { params: { type: tenantType.id }, body: { name: 'Renamed', id: 'ignored' } }),
        res,
        jest.fn(),
      );
      const expected = { ...tenantType, name: 'Renamed' };
      expect(writerMock.update).toHaveBeenCalledWith(tenantId, { [tenantType.id]: expected });
      expect(res.json).toHaveBeenCalledWith(expected);
    });

    it('saves a customization of a platform type', async () => {
      const events = [
        { namespace: 'test', name: 'run', templates: { email: { subject: 'Custom', body: 'Custom body' } } },
      ];
      await updateNotificationType(writerMock as never)(
        createRequest(admin, { params: { type: coreType.id }, body: { events } }),
        createResponse(),
        jest.fn(),
      );
      expect(writerMock.update).toHaveBeenCalledWith(tenantId, { [coreType.id]: { ...coreType, events } });
    });

    it('responds 404 for an unknown type', async () => {
      const next = jest.fn();
      await updateNotificationType(writerMock as never)(
        createRequest(admin, { params: { type: 'unknown' } }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('rejects a user without subscription-admin', async () => {
      const next = jest.fn();
      await updateNotificationType(writerMock as never)(
        createRequest(plain, { params: { type: tenantType.id } }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteNotificationType', () => {
    it('deletes a tenant type', async () => {
      const res = createResponse();
      await deleteNotificationType(writerMock as never)(
        createRequest(admin, { params: { type: tenantType.id } }),
        res,
        jest.fn(),
      );
      expect(writerMock.delete).toHaveBeenCalledWith(tenantId, tenantType.id);
      expect(res.json).toHaveBeenCalledWith({ deleted: true });
    });

    it('responds 404 for a platform type without a tenant customization', async () => {
      const next = jest.fn();
      await deleteNotificationType(writerMock as never)(
        createRequest(admin, { params: { type: coreType.id } }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(writerMock.delete).not.toHaveBeenCalled();
    });

    it('rejects a user without subscription-admin', async () => {
      const next = jest.fn();
      await deleteNotificationType(writerMock as never)(
        createRequest(plain, { params: { type: tenantType.id } }),
        createResponse(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getContact', () => {
    it('responds with the contact and from email', async () => {
      const res = createResponse();
      await getContact(createRequest(admin), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({ ...configurationMock.contact, fromEmail: 'noreply@test.co' });
    });

    it('rejects a user without subscription-admin', async () => {
      const next = jest.fn();
      await getContact(createRequest(plain), createResponse(), next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('updateContact', () => {
    it('saves contact changes merged with the existing contact', async () => {
      const res = createResponse();
      await updateContact(writerMock as never)(
        createRequest(admin, { body: { phoneNumber: '7807654321', other: 'ignored' } }),
        res,
        jest.fn(),
      );
      const contact = { ...configurationMock.contact, phoneNumber: '7807654321' };
      expect(writerMock.update).toHaveBeenCalledWith(tenantId, { contact });
      expect(res.json).toHaveBeenCalledWith({ ...contact, fromEmail: 'noreply@test.co' });
    });

    it('saves the from email', async () => {
      const res = createResponse();
      await updateContact(writerMock as never)(
        createRequest(admin, { body: { fromEmail: 'new@test.co' } }),
        res,
        jest.fn(),
      );
      expect(writerMock.update).toHaveBeenCalledWith(tenantId, { email: { fromEmail: 'new@test.co' } });
      expect(res.json).toHaveBeenCalledWith({ ...configurationMock.contact, fromEmail: 'new@test.co' });
    });

    it('saves nothing when there are no changes', async () => {
      const res = createResponse();
      await updateContact(writerMock as never)(createRequest(admin), res, jest.fn());
      expect(writerMock.update).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('rejects a user without subscription-admin', async () => {
      const next = jest.fn();
      await updateContact(writerMock as never)(createRequest(plain), createResponse(), next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
