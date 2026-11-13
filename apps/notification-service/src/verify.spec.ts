import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import axios from 'axios';
import { Channel, VerifyService } from './notification';
import { createVerifyService, VerifyServiceImpl } from './verify';
import verifyEmailTemplate from './assets/verify-email-template.hbs';
import verifySlackTemplate from './assets/verify-slack-template.hbs';
import verifySmsTemplate from './assets/verify-sms-template.hbs';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('verify', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const directory = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://verify-service'))),
    getResourceUrl: jest.fn(),
  };
  const tokenProvider = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };
  const providers = {
    email: {
      send: jest.fn(() => Promise.resolve()),
    },
    sms: {
      send: jest.fn(() => Promise.resolve()),
    },
    bot: {
      send: jest.fn(() => Promise.resolve()),
    },
  };
  const templateService = {
    generateMessage: jest.fn(() => ({
      subject: 'test',
      body: 'testing',
    })),
  };

  beforeEach(() => {
    directory.getServiceUrl.mockClear();
    tokenProvider.getAccessToken.mockClear();
    Object.values(providers).forEach((provider) => provider.send.mockClear());
    templateService.generateMessage.mockReset();
    axiosMock.post.mockReset();
  });

  describe('createVerifyService', () => {
    it('can create service', () => {
      const service = createVerifyService({
        providers,
        directory,
        tokenProvider,
        templateService,
      });
      expect(service).toBeTruthy();
    });
  });

  describe('VerifyServiceImpl', () => {
    let service: VerifyService = null;
    beforeEach(() => {
      service = new VerifyServiceImpl(providers, templateService, directory, tokenProvider, {
        email: { subject: '', body: verifyEmailTemplate },
        bot: { subject: '', body: verifySlackTemplate },
        sms: { subject: '', body: verifySmsTemplate },
      });
    });

    describe('sendCode', () => {
      it('can send code', async () => {
        axiosMock.post.mockResolvedValueOnce({ data: { code: '123', expiresAt: '2024-12-31T23:59:59.000Z' } });
        const key = await service.sendCode(
          tenantId,
          { channel: Channel.email, address: 'test@test.co', verifyKey: 'key', verified: false },
          'Verifying stuff.'
        );
        expect(key).toBeTruthy();
        expect(new URL(axiosMock.post.mock.calls[0][0]).searchParams.get('tenantId')).toBe(tenantId.toString());
        expect(axios.post).toHaveBeenCalled();
      });

      it('can throw for no template', async () => {
        await expect(
          service.sendCode(
            tenantId,
            { channel: 'invalid' as Channel, address: '123', verifyKey: 'key', verified: false },
            'Verifying stuff.'
          )
        ).rejects.toThrowError(InvalidOperationError);
      });

      it('can throw for no provider', async () => {
        await expect(
          service.sendCode(
            tenantId,
            { channel: 'invalid' as Channel, address: '123', verifyKey: 'key', verified: false },
            'Verifying stuff.'
          )
        ).rejects.toThrowError(InvalidOperationError);
      });
    });

    describe('sendCodeWithLink', () => {
      it('can send code with link', async () => {
        axiosMock.post.mockResolvedValueOnce({ data: { code: '123', expiresAt: '2024-12-31T23:59:59.000Z' } });
        const key = await service.sendCodeWithLink(
          tenantId,
          { channel: Channel.email, address: 'test@test.co', verifyKey: 'key', verified: false },
          'Verifying stuff.',
          10,
          'https://verification-link'
        );
        expect(key).toBeTruthy();
        expect(new URL(axiosMock.post.mock.calls[0][0]).searchParams.get('tenantId')).toBe(tenantId.toString());
        expect(axios.post).toHaveBeenCalled();
      });

      it('can throw for no template', async () => {
        await expect(
          service.sendCodeWithLink(
            tenantId,
            { channel: 'invalid' as Channel, address: '123', verifyKey: 'key', verified: false },
            'Verifying stuff.',
            10,
            'https://verification-link'
          )
        ).rejects.toThrowError(InvalidOperationError);
      });

      it('can throw for no provider', async () => {
        await expect(
          service.sendCodeWithLink(
            tenantId,
            { channel: 'invalid' as Channel, address: '123', verifyKey: 'key', verified: false },
            'Verifying stuff.',
            10,
            'https://verification-link'
          )
        ).rejects.toThrowError(InvalidOperationError);
      });
    });

    describe('verifyCode', () => {
      it('can verify code', async () => {
        axiosMock.post.mockResolvedValueOnce({ data: { verified: true } });
        const result = await service.verifyCode(
          tenantId,
          { channel: Channel.email, address: 'test@test.co', verifyKey: 'key', verified: false },
          '123'
        );
        expect(result).toBe(true);
        expect(new URL(axiosMock.post.mock.calls[0][0]).searchParams.get('tenantId')).toBe(tenantId.toString());
        expect(axios.post).toHaveBeenCalled();
      });

      it('can throw for no key', async () => {
        await expect(
          service.verifyCode(tenantId, { channel: Channel.email, address: 'test@test.co', verified: false }, '123')
        ).rejects.toThrowError(InvalidOperationError);
      });
    });
  });
});
