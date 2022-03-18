import { InvalidOperationError } from '@core-services/core-common';
import { ActivityTypes, Channels, CloudAdapter, TurnContext } from 'botbuilder';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { Channel } from '../notification';
import { BotNotificationActivityHandler, createBotProvider } from './bot';
import { ConversationRecord } from './types';

jest.mock('botbuilder');
const MockedCloudAdapter = CloudAdapter as unknown as jest.MockedClass<typeof CloudAdapter>;

describe('createBotProvider', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    get: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  const botParameters = {
    BOT_APP_ID: 'app-123',
    BOT_APP_SECRET: 'bot-secret',
    BOT_APP_TYPE: 'SingleTenant',
    BOT_TENANT_ID: 'tenant-123',
  };

  it('can create provider', () => {
    const provider = createBotProvider(loggerMock, repositoryMock, botParameters);
    expect(provider).toBeTruthy();
  });

  describe('BotNotificationProvider', () => {
    beforeEach(() => {
      repositoryMock.get.mockReset();
      MockedCloudAdapter.mockReset();
    });

    it('can process message', async () => {
      const req = {};
      const res = {};

      const provider = createBotProvider(loggerMock, repositoryMock, botParameters);
      await provider.processMessage(req as Request, res as Response);
      const adapter = MockedCloudAdapter.mock.instances[0];
      expect(adapter.process).toHaveBeenCalledWith(req, res, expect.any(Function));
    });

    it('can send msteams', async () => {
      const notification = {
        to: 'msteams/123teams',
        message: { subject: 'testing 123', body: 'testing testing 1 2 3' },
      };

      const record: ConversationRecord = {
        tenantId: 'tenant-123',
        name: null,
        botId: 'bot-123',
        botName: null,
        channelId: Channels.Msteams,
        conversationId: '123teams',
        serviceUrl: 'https://teams',
      };
      repositoryMock.get.mockResolvedValueOnce(record);
      const provider = createBotProvider(loggerMock, repositoryMock, botParameters);
      await provider.send(notification);
      expect(MockedCloudAdapter.mock.instances[0].createConversationAsync).toHaveBeenCalledWith(
        botParameters.BOT_APP_ID,
        Channels.Msteams,
        record.serviceUrl,
        null,
        expect.objectContaining({
          isGroup: true,
          channelData: expect.objectContaining({
            channel: expect.objectContaining({
              id: record.conversationId,
            }),
          }),
          activity: expect.objectContaining({
            type: ActivityTypes.Message,
            text: `${notification.message.subject}\n\n${notification.message.body}`,
            textFormat: 'markdown',
          }),
        }),
        expect.any(Function)
      );
    });

    it('can send slack', async () => {
      const notification = {
        to: 'slack/team123/channel123',
        message: { subject: 'testing 123', body: 'testing testing 1 2 3' },
      };

      const record: ConversationRecord = {
        tenantId: 'team123',
        name: null,
        botId: 'bot-123',
        botName: null,
        channelId: Channels.Slack,
        conversationId: 'channel123',
        serviceUrl: 'https://slack',
      };
      repositoryMock.get.mockResolvedValueOnce(record);
      const provider = createBotProvider(loggerMock, repositoryMock, botParameters);
      await provider.send(notification);
      expect(MockedCloudAdapter.mock.instances[0].continueConversationAsync).toHaveBeenCalledWith(
        botParameters.BOT_APP_ID,
        expect.objectContaining({
          bot: {
            id: `${record.botId}:${record.tenantId}`,
            name: record.botName,
          },
          channelId: Channels.Slack,
          serviceUrl: record.serviceUrl,
          conversation: expect.objectContaining({
            id: `${record.botId}:${record.tenantId}:${record.conversationId}`,
            name: record.name,
            isGroup: true,
          }),
        }),
        expect.any(Function)
      );
    });

    it('can throw invalid operation for no reference', async () => {
      const notification = {
        to: 'msteams/123teams',
        message: { subject: 'testing 123', body: 'testing testing 1 2 3' },
      };

      repositoryMock.get.mockResolvedValueOnce(null);
      const provider = createBotProvider(loggerMock, repositoryMock, botParameters);
      await expect(provider.send(notification)).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('BotNotificationActivityHandler', () => {
    it('can be constructed', () => {
      const handler = new BotNotificationActivityHandler(loggerMock, repositoryMock);
      expect(handler).toBeTruthy();
    });

    describe('instance', () => {
      const handler = new BotNotificationActivityHandler(loggerMock, repositoryMock);

      beforeEach(() => {
        // TODO;
      });

      it('can handle members added', async () => {
        const next = jest.fn();
        handler.handleMembersAdded({} as TurnContext, next);
      });
    });
  });
});
