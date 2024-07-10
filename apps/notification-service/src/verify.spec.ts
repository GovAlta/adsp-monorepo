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

    // describe('constructor', () => {
    //   it('should initialize templates correctly', () => {
    //     expect(service).toBeTruthy();
    //     expect(service['templates'][Channel.email]).toEqual({
    //       subject: 'Your verify code',
    //       body: expect.any(Function),
    //     });
    //     expect(service['templates'][Channel.bot]).toEqual({
    //       subject: 'Your verify code',
    //       body: verifySlackTemplate,
    //     });
    //     expect(service['templates'][Channel.sms]).toEqual({
    //       subject: 'Your verify code',
    //       body: verifySmsTemplate,
    //     });
    //   });
    // });

    describe('sendCode', () => {
      it('can send code', async () => {
        axiosMock.post.mockResolvedValueOnce({ data: { code: '123', expiresAt: '2024-12-31T23:59:59.000Z' } });
        const key = await service.sendCode(
          { channel: Channel.email, address: 'test@test.co', verifyKey: 'key', verified: false },
          'Verifying stuff.'
        );
        expect(key).toBeTruthy();
        expect(axios.post).toHaveBeenCalled();
      });

      it('can throw for no template', async () => {
        await expect(
          service.sendCode(
            { channel: 'invalid' as Channel, address: '123', verifyKey: 'key', verified: false },
            'Verifying stuff.'
          )
        ).rejects.toThrowError(InvalidOperationError);
      });

      it('can throw for no provider', async () => {
        await expect(
          service.sendCode(
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
          { channel: Channel.email, address: 'test@test.co', verifyKey: 'key', verified: false },
          'Verifying stuff.',
          10,
          'https://verification-link'
        );
        expect(key).toBeTruthy();
        expect(axios.post).toHaveBeenCalled();
      });

      it('can throw for no template', async () => {
        await expect(
          service.sendCodeWithLink(
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
          { channel: Channel.email, address: 'test@test.co', verifyKey: 'key', verified: false },
          '123'
        );
        expect(result).toBe(true);
        expect(axios.post).toHaveBeenCalled();
      });

      it('can throw for no key', async () => {
        await expect(
          service.verifyCode({ channel: Channel.email, address: 'test@test.co', verified: false }, '123')
        ).rejects.toThrowError(InvalidOperationError);
      });
    });
  });
});
