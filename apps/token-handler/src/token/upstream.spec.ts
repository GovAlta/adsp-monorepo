import { adspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Logger } from 'winston';
import { createRestrictedDirectory } from './upstream';

describe('upstream', () => {
  describe('createRestrictedDirectory', () => {
    const loggerMock = { warn: jest.fn() };
    const directoryMock = {
      getServiceUrl: jest.fn(),
      getResourceUrl: jest.fn(),
    };

    beforeEach(() => {
      loggerMock.warn.mockClear();
      directoryMock.getServiceUrl.mockReset();
      directoryMock.getResourceUrl.mockReset();
    });

    const create = (domains: string[]) =>
      createRestrictedDirectory(directoryMock as ServiceDirectory, domains, loggerMock as unknown as Logger);

    it('can return the directory when there are no allowed domains', () => {
      expect(create([])).toBe(directoryMock);
    });

    it('can resolve allowed service URL', async () => {
      const id = adspId`urn:ads:platform:form-service:v1`;
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://form-service:3333/form/v1'));

      const url = await create(['form-service']).getServiceUrl(id);

      expect(url.href).toBe('http://form-service:3333/form/v1');
      expect(directoryMock.getServiceUrl).toHaveBeenCalledWith(id);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    it('can resolve allowed resource URL', async () => {
      const id = adspId`urn:ads:test:app:v1:/things`;
      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('https://app.apps.example.ca/v1/things'));

      const url = await create(['*.apps.example.ca']).getResourceUrl(id);

      expect(url.href).toBe('https://app.apps.example.ca/v1/things');
    });

    it('can resolve platform service URL that is not in the allowed domains', async () => {
      const id = adspId`urn:ads:platform:form-service:v1`;
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://form-service:3333/form/v1'));

      const url = await create(['*.example.org']).getServiceUrl(id);

      expect(url.href).toBe('http://form-service:3333/form/v1');
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    it('can resolve platform resource URL that is not in the allowed domains', async () => {
      const id = adspId`urn:ads:platform:form-service:v1:/forms`;
      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://form-service:3333/form/v1/forms'));

      const url = await create(['*.example.org']).getResourceUrl(id);

      expect(url.href).toBe('http://form-service:3333/form/v1/forms');
    });

    it.each([
      ['urn:ads:tenant:form-service:v1'],
      ['urn:ads:platform-tenant:form-service:v1'],
      ['urn:ads:platformx:form-service:v1'],
      ['urn:ads:Platform:form-service:v1'],
      ['urn:ads:PLATFORM:form-service:v1'],
    ])('can reject internal URL for the namespace of %s', async (urn) => {
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://form-service:3333/form/v1'));

      await expect(create(['*.example.org']).getServiceUrl(adspId`${urn}`)).rejects.toThrow(InvalidOperationError);
    });

    it('can reject service URL for a domain that is not allowed', async () => {
      const id = adspId`urn:ads:test:app:v1`;
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://169.254.169.254/metadata'));

      const restricted = create(['form-service']);
      await expect(restricted.getServiceUrl(id)).rejects.toThrow(InvalidOperationError);

      // The host is logged for the operator, but is not part of the error returned to the client.
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('169.254.169.254'), expect.anything());
    });

    it('does not include the host in the error', async () => {
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://internal-host:8080'));

      await expect(create(['form-service']).getServiceUrl(adspId`urn:ads:test:app:v1`)).rejects.toThrow(
        'Upstream urn:ads:test:app:v1 is not permitted.'
      );
    });

    it('can reject resource URL for a domain that is not allowed', async () => {
      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('https://evil.com/v1/things'));

      await expect(create(['*.apps.example.ca']).getResourceUrl(adspId`urn:ads:test:app:v1:/things`)).rejects.toThrow(
        InvalidOperationError
      );
    });

    it('can limit logging of repeated rejections', async () => {
      const id = adspId`urn:ads:test:app:v1`;
      directoryMock.getServiceUrl.mockResolvedValue(new URL('http://internal-host:8080'));
      const restricted = create(['form-service']);

      for (let i = 0; i < 5; i++) {
        await expect(restricted.getServiceUrl(id)).rejects.toThrow(InvalidOperationError);
      }
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);

      // A different upstream or host is logged separately.
      directoryMock.getServiceUrl.mockResolvedValue(new URL('http://other-host:8080'));
      await expect(restricted.getServiceUrl(id)).rejects.toThrow(InvalidOperationError);
      expect(loggerMock.warn).toHaveBeenCalledTimes(2);
    });

    it('can pass through directory errors', async () => {
      directoryMock.getServiceUrl.mockRejectedValueOnce(new Error('Failed to find directory entry'));

      await expect(create(['form-service']).getServiceUrl(adspId`urn:ads:test:app:v1`)).rejects.toThrow(
        'Failed to find directory entry'
      );
    });
  });
});
