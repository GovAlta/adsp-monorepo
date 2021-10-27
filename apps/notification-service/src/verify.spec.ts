import { InvalidOperationError } from '@core-services/core-common';
import axios from 'axios';
import { Channel, VerifyService } from './notification';
import { createVerifyService, VerifyServiceImpl } from './verify';

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
    providers.email.send.mockClear();
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
        email: { subject: '', body: '' },
      });
    });

    describe('sendCode', () => {
      it('can send code', async () => {
        axiosMock.post.mockResolvedValueOnce({ data: { code: '123' } });
        const key = await service.sendCode(
          { channel: Channel.email, address: 'test@test.co', verifyKey: 'key', verified: false },
          'Verifying stuff.'
        );
        expect(key).toBeTruthy();
        expect(axios.post).toHaveBeenCalled();
      });

      it('can throw for no template', async () => {
        axiosMock.post.mockResolvedValueOnce({ data: { code: '123' } });
        await expect(
          service.sendCode(
            { channel: Channel.sms, address: '123', verifyKey: 'key', verified: false },
            'Verifying stuff.'
          )
        ).rejects.toThrowError(InvalidOperationError);
      });

      it('can throw for no provider', async () => {
        axiosMock.post.mockResolvedValueOnce({ data: { code: '123' } });
        await expect(
          service.sendCode(
            { channel: Channel.slack, address: '123', verifyKey: 'key', verified: false },
            'Verifying stuff.'
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
        axiosMock.post.mockResolvedValueOnce({ data: { verified: true } });
        await expect(
          service.verifyCode({ channel: Channel.email, address: 'test@test.co', verified: false }, '123')
        ).rejects.toThrowError(InvalidOperationError);
      });
    });
  });
});
