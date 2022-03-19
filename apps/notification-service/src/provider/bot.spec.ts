import { InvalidOperationError } from '@core-services/core-common';
import { ActivityTypes, Channels, CloudAdapter, TurnContext, teamsGetChannelId, Activity } from 'botbuilder';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { BotNotificationActivityHandler, createBotProvider } from './bot';
import { ConversationRecord } from './types';

jest.mock('botbuilder');
const MockedCloudAdapter = CloudAdapter as jest.MockedClass<typeof CloudAdapter>;
const mockedTeamsGetChannelId = teamsGetChannelId as jest.MockedFunction<typeof teamsGetChannelId>;
const mockedGetConversationReference = TurnContext.getConversationReference as jest.MockedFunction<
  typeof TurnContext.getConversationReference
>;

describe('createBotProvider', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    get: jest.fn(),
    delete: jest.fn(() => Promise.resolve(true)),
    save: jest.fn((record) => Promise.resolve(record)),
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
      repositoryMock.get.mockClear();
      MockedCloudAdapter.mockClear();
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
        repositoryMock.save.mockClear();
        repositoryMock.delete.mockClear();
        mockedTeamsGetChannelId.mockClear();
      });

      describe('handleMembersAdded', () => {
        it('can handle members added without bot added', async () => {
          const context = {
            activity: {
              recipient: { id: 'bot-123' },
              membersAdded: [{ id: 'human-123' }],
            },
          };
          const next = jest.fn();
          handler.handleMembersAdded(context as unknown as TurnContext, next);
          expect(next).toHaveBeenCalled();
        });

        it('can handle members added with teams bot added', async () => {
          const activity = {
            channelId: Channels.Msteams,
            recipient: { id: 'bot-123', name: 'boti' },
            membersAdded: [{ id: 'bot-123' }],
            channelData: {
              tenant: { id: 'tenant-123' },
              team: { id: 'team-123' },
            },
            serviceUrl: 'https://teams',
          };
          const next = jest.fn();
          mockedTeamsGetChannelId.mockReturnValueOnce('conversation-123');
          await handler.handleMembersAdded({ activity } as unknown as TurnContext, next);
          expect(repositoryMock.save).toHaveBeenCalledWith({
            botId: activity.recipient.id,
            botName: activity.recipient.name,
            channelId: activity.channelId,
            conversationId: 'conversation-123',
            serviceUrl: activity.serviceUrl,
            tenantId: activity.channelData.tenant.id,
          });
          expect(next).toHaveBeenCalled();
        });

        it('can handle members added with slack bot added', async () => {
          const activity = {
            channelId: Channels.Slack,
            recipient: { id: 'bot-123:team-123', name: 'boti' },
            membersAdded: [{ id: 'bot-123:team-123' }],
            channelData: {
              SlackMessage: {
                event: { team: 'team-123', channel: 'team-123:channel-123' },
              },
            },
            serviceUrl: 'https://slack',
          };
          const next = jest.fn();
          await handler.handleMembersAdded({ activity } as unknown as TurnContext, next);
          expect(repositoryMock.save).toHaveBeenCalledWith({
            botId: 'bot-123',
            botName: activity.recipient.name,
            channelId: activity.channelId,
            conversationId: 'team-123:channel-123',
            serviceUrl: activity.serviceUrl,
            tenantId: 'team-123',
          });
          expect(next).toHaveBeenCalled();
        });

        it('can handle members added with default bot added', async () => {
          const activity = {
            channelId: Channels.Directline,
            recipient: { id: 'bot-123', name: 'boti' },
            membersAdded: [{ id: 'bot-123' }],
            conversation: { id: 'conversation-123', tenantId: 'tenant-123' },
            serviceUrl: 'https://unknown',
          };
          const next = jest.fn();
          await handler.handleMembersAdded({ activity } as unknown as TurnContext, next);
          expect(repositoryMock.save).toHaveBeenCalledWith({
            botId: 'bot-123',
            botName: activity.recipient.name,
            channelId: activity.channelId,
            conversationId: 'conversation-123',
            serviceUrl: activity.serviceUrl,
            tenantId: 'tenant-123',
          });
          expect(next).toHaveBeenCalled();
        });
      });

      describe('handleMembersRemoved', () => {
        it('can handle members removed without bot removed', async () => {
          const context = {
            activity: {
              recipient: { id: 'bot-123' },
              membersRemoved: [{ id: 'human-123' }],
            },
          };
          const next = jest.fn();
          handler.handleMembersRemoved(context as unknown as TurnContext, next);
          expect(next).toHaveBeenCalled();
        });

        it('can handle members removed with default bot removed', async () => {
          const activity = {
            channelId: Channels.Directline,
            recipient: { id: 'bot-123', name: 'boti' },
            membersRemoved: [{ id: 'bot-123' }],
            conversation: { id: 'conversation-123', tenantId: 'tenant-123' },
            serviceUrl: 'https://unknown',
          };
          const next = jest.fn();
          await handler.handleMembersRemoved({ activity } as unknown as TurnContext, next);
          expect(repositoryMock.delete).toHaveBeenCalledWith({
            channelId: activity.channelId,
            conversationId: 'conversation-123',
            tenantId: 'tenant-123',
          });
          expect(next).toHaveBeenCalled();
        });
      });

      describe('handleMessage', () => {
        it('can handle message from teams', async () => {
          const activity = {
            channelId: Channels.Msteams,
            recipient: { id: 'bot-123', name: 'boti' },
            channelData: {
              tenant: { id: 'tenant-123' },
              team: { id: 'team-123' },
            },
            serviceUrl: 'https://teams',
          };
          const next = jest.fn();
          const sendActivity = jest.fn();
          mockedTeamsGetChannelId.mockReturnValueOnce('conversation-123');
          mockedTeamsGetChannelId.mockReturnValueOnce('conversation-123');
          mockedGetConversationReference.mockReturnValueOnce(activity);
          await handler.handleMessage({ activity, sendActivity } as unknown as TurnContext, next);
          expect(repositoryMock.save).toHaveBeenCalledWith({
            botId: activity.recipient.id,
            botName: activity.recipient.name,
            channelId: activity.channelId,
            conversationId: 'conversation-123',
            serviceUrl: activity.serviceUrl,
            tenantId: activity.channelData.tenant.id,
          });
          expect(sendActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              text: `*Bee boop...* Ready to send notifications to this channel at address: **${activity.channelId}/conversation-123**`,
              textFormat: 'markdown',
            })
          );
          expect(next).toHaveBeenCalled();
        });

        it('can handle message from slack', async () => {
          const activity = {
            channelId: Channels.Slack,
            recipient: { id: 'bot-123:team-123', name: 'boti' },
            channelData: {
              SlackMessage: {
                event: { team: 'team-123', channel: 'team-123:channel-123' },
              },
            },
            conversation: {
              id: 'bot-123:team-123:channel-123',
            },
            serviceUrl: 'https://slack',
          };
          const next = jest.fn();
          const sendActivity = jest.fn();
          mockedGetConversationReference.mockReturnValueOnce(activity as Partial<Activity>);
          await handler.handleMessage({ activity, sendActivity } as unknown as TurnContext, next);
          expect(repositoryMock.save).toHaveBeenCalledWith({
            botId: 'bot-123',
            botName: activity.recipient.name,
            channelId: activity.channelId,
            conversationId: 'team-123:channel-123',
            serviceUrl: activity.serviceUrl,
            tenantId: 'team-123',
          });
          expect(sendActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              text: `*Bee boop...* Ready to send notifications to this channel at address: **${activity.channelId}/team-123/channel-123**`,
              textFormat: 'markdown',
            })
          );
          expect(next).toHaveBeenCalled();
        });

        it('can handle message from default', async () => {
          const activity = {
            channelId: Channels.Directline,
            recipient: { id: 'bot-123', name: 'boti' },
            membersAdded: [{ id: 'bot-123' }],
            conversation: { id: 'conversation-123', tenantId: 'tenant-123' },
            serviceUrl: 'https://unknown',
          };
          const next = jest.fn();
          const sendActivity = jest.fn();
          mockedGetConversationReference.mockReturnValueOnce(activity as Partial<Activity>);
          await handler.handleMessage({ activity, sendActivity } as unknown as TurnContext, next);
          expect(repositoryMock.save).toHaveBeenCalledWith({
            botId: 'bot-123',
            botName: activity.recipient.name,
            channelId: activity.channelId,
            conversationId: 'conversation-123',
            serviceUrl: activity.serviceUrl,
            tenantId: 'tenant-123',
          });
          expect(sendActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              text: `*Bee boop...* Ready to send notifications to this channel at address: **${activity.channelId}/conversation-123**`,
              textFormat: 'markdown',
            })
          );
          expect(next).toHaveBeenCalled();
        });
      });
    });
  });
});
