import { adspId } from '@abgov/adsp-service-sdk';
import { Channel } from '../types';
import { SubscriberEntity } from '../model';
import { mapSubscriber } from './mappers';

describe('mapSubscriber', () => {
  const apiId = adspId`urn:ads:platform:notification-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const entityFor = (subscriber: Record<string, unknown>) =>
    new SubscriberEntity(null, {
      tenantId,
      id: 'subscriber-1',
      addressAs: 'Tester',
      channels: [],
      ...subscriber,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

  it('maps the subscriber to its api representation', () => {
    const mapped = mapSubscriber(apiId, entityFor({ userId: 'user-1' }));

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'subscriber-1',
        addressAs: 'Tester',
        userId: 'user-1',
        tenantId: tenantId.toString(),
        urn: 'urn:ads:platform:notification-service:v1:/subscribers/subscriber-1',
      }),
    );
  });

  it('maps the channels a subscriber can be reached at', () => {
    const mapped = mapSubscriber(
      apiId,
      entityFor({
        channels: [{ channel: Channel.email, address: 'tester@test.co', verified: true }],
      }),
    );

    expect(mapped.channels).toEqual([
      expect.objectContaining({ channel: Channel.email, address: 'tester@test.co', verified: true }),
    ]);
  });

  // The registry shows these in the details of the selected recipient.
  it('maps the dates the subscriber was created and last changed', () => {
    const created = new Date('2026-01-02T18:00:00.000Z');
    const updated = new Date('2026-02-03T18:00:00.000Z');

    const mapped = mapSubscriber(apiId, entityFor({ created, updated }));

    expect(mapped).toEqual(expect.objectContaining({ created, updated }));
  });

  it('omits a verify key so that it is never sent to a caller', () => {
    const mapped = mapSubscriber(
      apiId,
      entityFor({
        channels: [{ channel: Channel.email, address: 'tester@test.co', verified: false, verifyKey: 'secret' }],
      }),
    );

    expect(mapped.channels[0]).not.toHaveProperty('verifyKey');
  });
});
