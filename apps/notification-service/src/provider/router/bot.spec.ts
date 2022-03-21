import { Request, Response } from 'express';
import { BotNotificationProvider } from '../bot';
import { createBotProviderRouter, processMessage } from './bot';

describe('createBotProviderRouter', () => {
  const provider = { processMessage: jest.fn() };
  it('can create router', () => {
    const router = createBotProviderRouter({ provider: provider as unknown as BotNotificationProvider });
    expect(router).toBeTruthy();
  });

  describe('processMessage', () => {
    beforeEach(() => {
      provider.processMessage.mockReset();
    });

    it('can create handler', () => {
      const handler = processMessage(provider as unknown as BotNotificationProvider);
      expect(handler).toBeTruthy();
    });

    it('can handle message request', async () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      const handler = processMessage(provider as unknown as BotNotificationProvider);
      await handler(req as Request, res as Response, next);
      expect(provider.processMessage).toHaveBeenCalledWith(req, res);
    });

    it('can call next for process error', async () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      const err = new Error('oh noes!');
      provider.processMessage.mockRejectedValueOnce(err);
      const handler = processMessage(provider as unknown as BotNotificationProvider);
      await handler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
