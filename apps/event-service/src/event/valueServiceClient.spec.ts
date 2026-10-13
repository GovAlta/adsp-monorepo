import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { countEvents } from './valueServiceClient';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('countEvents', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  beforeEach(() => {
    directoryMock.getServiceUrl.mockReset();
    tokenProviderMock.getAccessToken.mockReset();
    axiosMock.get.mockReset();

    directoryMock.getServiceUrl.mockResolvedValue(new URL('http://totally-real-value-service'));
    tokenProviderMock.getAccessToken.mockResolvedValue('test-token');
  });

  it('resolves the value service url from the directory', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      {},
    );

    expect(directoryMock.getServiceUrl).toHaveBeenCalledWith(
      expect.objectContaining({ toString: expect.any(Function) }),
    );
  });

  it('requests the count with a bearer token', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      {},
    );

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.stringContaining('v1/event-service/values/event/count'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
  });

  it('includes the tenantId in the request params', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      {},
    );

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: expect.objectContaining({ tenantId: tenantId.toString() }) }),
    );
  });

  it('excludes context, timestamps, and correlationId when criteria is empty', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      {},
    );

    const [, config] = axiosMock.get.mock.calls[0];
    expect(config.params).not.toHaveProperty('context');
    expect(config.params).not.toHaveProperty('timestampMin');
    expect(config.params).not.toHaveProperty('timestampMax');
    expect(config.params).not.toHaveProperty('correlationId');
  });

  it('includes context as a JSON string when provided', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      { context: { namespace: 'application-events', name: 'user-registration' } },
    );

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          context: JSON.stringify({ namespace: 'application-events', name: 'user-registration' }),
        }),
      }),
    );
  });

  it('includes timestampMin as an ISO string when provided', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });
    const timestampMin = new Date('2021-03-23T12:00:00Z');

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      { timestampMin },
    );

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: expect.objectContaining({ timestampMin: timestampMin.toISOString() }) }),
    );
  });

  it('includes timestampMax as an ISO string when provided', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });
    const timestampMax = new Date('2021-03-24T12:00:00Z');

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      { timestampMax },
    );

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: expect.objectContaining({ timestampMax: timestampMax.toISOString() }) }),
    );
  });

  it('includes correlationId when provided', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });

    await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      { correlationId: 'Bobs-user-id' },
    );

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: expect.objectContaining({ correlationId: 'Bobs-user-id' }) }),
    );
  });

  it('returns the count from the response', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 42 } });

    const result = await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      {},
    );

    expect(result).toBe(42);
  });

  it('returns 0 when the response has no data', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: undefined });

    const result = await countEvents(
      directoryMock as unknown as ServiceDirectory,
      tokenProviderMock as unknown as TokenProvider,
      tenantId,
      {},
    );

    expect(result).toBe(0);
  });

  it('propagates errors from the value service request', async () => {
    const err = new Error('upstream failure');
    axiosMock.get.mockRejectedValueOnce(err);

    await expect(
      countEvents(
        directoryMock as unknown as ServiceDirectory,
        tokenProviderMock as unknown as TokenProvider,
        tenantId,
        {},
      ),
    ).rejects.toThrow(err);
  });
});
