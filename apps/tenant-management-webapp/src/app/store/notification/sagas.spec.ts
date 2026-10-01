import { expectSaga } from 'redux-saga-test-plan';
import axios from 'axios';
import { getAccessToken } from '@store/tenant/sagas';
import {
  deleteNotificationTypes,
  fetchCoreNotificationTypes,
  fetchNotificationTypes,
  updateContactInformation,
  updateEmailInformation,
  updateNotificationType,
} from './sagas';
import {
  DELETE_NOTIFICATION_TYPE,
  FETCH_CORE_NOTIFICATION_TYPES_SUCCEEDED,
  FETCH_NOTIFICATION_CONFIGURATION,
  FETCH_NOTIFICATION_CONFIGURATION_SUCCEEDED,
  UPDATE_CONTACT_INFORMATION,
  UPDATE_EMAIL_INFORMATION,
  UPDATE_NOTIFICATION_TYPE,
} from './actions';
import { NotificationItem } from './models';

const notificationServiceUrl = 'http://notification-service';
const headers = { headers: { Authorization: 'Bearer mock-token' } };

const tenantType: NotificationItem = {
  id: 'tenant-type',
  name: 'Tenant type',
  description: '',
  publicSubscribe: false,
  subscriberRoles: [],
  channels: ['email'],
  events: [],
};
const coreType: NotificationItem = {
  ...tenantType,
  id: 'core-type',
  name: 'Core type',
  events: [{ namespace: 'test', name: 'run', templates: { email: { subject: 'Ran', body: 'It ran.' } } }],
};

const storeState = (notificationTypes: Record<string, NotificationItem> = {}) => ({
  config: { serviceUrls: { notificationServiceUrl } },
  notification: { core: { [coreType.id]: coreType }, notificationTypes },
});

// Runs the saga with axios stubbed, and returns the axios calls made and the actions put.
const runSaga = async (saga, action, state = storeState(), responses: Record<string, unknown> = {}) => {
  const calls: { method: string; args: unknown[] }[] = [];
  const methods = new Map<unknown, string>([
    [axios.get, 'get'],
    [axios.post, 'post'],
    [axios.patch, 'patch'],
    [axios.delete, 'delete'],
  ]);

  const { effects } = await expectSaga(saga, action)
    .withState(state)
    .provide({
      call(effect, next) {
        if (effect.fn === getAccessToken) {
          return 'mock-token';
        }
        const method = methods.get(effect.fn);
        if (method) {
          calls.push({ method, args: effect.args });
          return { data: responses[effect.args[0] as string] };
        }
        return next();
      },
    })
    .run();

  return { calls, actions: (effects.put || []).map((e) => e.payload.action) };
};

describe('notification sagas', () => {
  describe('fetchNotificationTypes', () => {
    it('fetches tenant types and contact from the notification service', async () => {
      const { calls, actions } = await runSaga(fetchNotificationTypes, undefined, storeState(), {
        [`${notificationServiceUrl}/subscription/v1/types?source=tenant`]: [tenantType],
        [`${notificationServiceUrl}/subscription/v1/contact`]: {
          contactEmail: 'support@test.co',
          phoneNumber: '7801234567',
          supportInstructions: 'Call us.',
          fromEmail: 'noreply@test.co',
        },
      });

      expect(calls.map(({ method, args }) => [method, args[0]])).toEqual([
        ['get', `${notificationServiceUrl}/subscription/v1/types?source=tenant`],
        ['get', `${notificationServiceUrl}/subscription/v1/contact`],
      ]);
      const succeeded = actions.find((a) => a.type === FETCH_NOTIFICATION_CONFIGURATION_SUCCEEDED);
      expect(succeeded.payload).toEqual({
        notificationInfo: { data: { [tenantType.id]: tenantType } },
        contact: { contactEmail: 'support@test.co', phoneNumber: '7801234567', supportInstructions: 'Call us.' },
        email: { fromEmail: 'noreply@test.co' },
      });
    });
  });

  describe('fetchCoreNotificationTypes', () => {
    it('fetches core types from the notification service', async () => {
      const { calls, actions } = await runSaga(fetchCoreNotificationTypes, undefined, storeState(), {
        [`${notificationServiceUrl}/subscription/v1/types?source=core`]: [coreType],
      });

      expect(calls[0].args[0]).toBe(`${notificationServiceUrl}/subscription/v1/types?source=core`);
      const succeeded = actions.find((a) => a.type === FETCH_CORE_NOTIFICATION_TYPES_SUCCEEDED);
      expect(Object.keys(succeeded.payload.notificationInfo.data)).toEqual([coreType.id]);
    });
  });

  describe('deleteNotificationTypes', () => {
    it('deletes the type and refreshes', async () => {
      const { calls, actions } = await runSaga(deleteNotificationTypes, {
        type: DELETE_NOTIFICATION_TYPE,
        payload: { ...tenantType, id: 'type with space' },
      });

      expect(calls).toEqual([
        { method: 'delete', args: [`${notificationServiceUrl}/subscription/v1/types/type%20with%20space`, headers] },
      ]);
      expect(actions.map((a) => a.type)).toContain(FETCH_NOTIFICATION_CONFIGURATION);
    });
  });

  describe('updateNotificationType', () => {
    const update = (payload: NotificationItem, notificationTypes = {}) =>
      runSaga(updateNotificationType, { type: UPDATE_NOTIFICATION_TYPE, payload }, storeState(notificationTypes));

    it('creates a new type', async () => {
      const { calls } = await update({ ...tenantType, id: 'new-type' });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe('post');
      expect(calls[0].args[0]).toBe(`${notificationServiceUrl}/subscription/v1/types`);
      expect(calls[0].args[1]).toMatchObject({ id: 'new-type', name: tenantType.name });
    });

    it('updates an existing tenant type', async () => {
      const { calls } = await update({ ...tenantType, name: 'Renamed' }, { [tenantType.id]: tenantType });

      expect(calls[0].method).toBe('patch');
      expect(calls[0].args[0]).toBe(`${notificationServiceUrl}/subscription/v1/types/tenant-type`);
      expect(calls[0].args[1]).toMatchObject({ name: 'Renamed' });
    });

    it('saves a customization of a core type with only event namespace, name, and templates', async () => {
      const { calls } = await update({
        ...coreType,
        events: [{ ...coreType.events[0], customized: true }],
      });

      expect(calls[0].method).toBe('patch');
      expect(calls[0].args[0]).toBe(`${notificationServiceUrl}/subscription/v1/types/core-type`);
      expect(calls[0].args[1]).toMatchObject({ events: coreType.events });
    });

    it('removes the customization of a core type without customized events', async () => {
      const { calls } = await update({ ...coreType, events: [] }, { [coreType.id]: coreType });

      expect(calls).toEqual([
        { method: 'delete', args: [`${notificationServiceUrl}/subscription/v1/types/core-type`, headers] },
      ]);
    });

    it('does nothing for a core type without events or a customization', async () => {
      const { calls, actions } = await update({ ...coreType, events: [] });

      expect(calls).toEqual([]);
      expect(actions.map((a) => a.type)).toContain(FETCH_NOTIFICATION_CONFIGURATION);
    });

    it('defaults the channels of types without them', async () => {
      const { calls } = await update({ ...tenantType, channels: undefined }, { [tenantType.id]: tenantType });

      expect(calls[0].args[1]).toMatchObject({ channels: ['email'] });
    });
  });

  describe('updateContactInformation', () => {
    it('saves the contact to the notification service', async () => {
      const contact = { contactEmail: 'support@test.co', phoneNumber: '7801234567', supportInstructions: 'Call us.' };
      const { calls } = await runSaga(updateContactInformation, { type: UPDATE_CONTACT_INFORMATION, payload: contact });

      expect(calls).toEqual([
        { method: 'patch', args: [`${notificationServiceUrl}/subscription/v1/contact`, contact, headers] },
      ]);
    });
  });

  describe('updateEmailInformation', () => {
    it('saves the from email to the notification service', async () => {
      const { calls } = await runSaga(updateEmailInformation, {
        type: UPDATE_EMAIL_INFORMATION,
        payload: { fromEmail: 'noreply@test.co' },
      });

      expect(calls).toEqual([
        {
          method: 'patch',
          args: [`${notificationServiceUrl}/subscription/v1/contact`, { fromEmail: 'noreply@test.co' }, headers],
        },
      ]);
    });
  });

  it('reports errors from the notification service', async () => {
    const { actions } = await expectSaga(deleteNotificationTypes, {
      type: DELETE_NOTIFICATION_TYPE,
      payload: tenantType,
    })
      .withState(storeState())
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'mock-token';
          }
          if (effect.fn === axios.delete) {
            throw new Error('Request failed');
          }
          return next();
        },
      })
      .run()
      .then(({ effects }) => ({ actions: effects.put.map((e) => e.payload.action) }));

    expect(actions.map((a) => a.type)).not.toContain(FETCH_NOTIFICATION_CONFIGURATION);
    expect(actions).toHaveLength(1);
  });
});
