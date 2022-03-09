import { Channels } from 'botbuilder';

export interface ConversationIdentity {
  channelId: Channels;
  tenantId: string;
  conversationId: string;
}

export interface ConversationRecord extends ConversationIdentity {
  name: string;
  serviceUrl: string;
  botId: string;
  botName: string;
}

export interface BotRepository {
  get(conversation: ConversationIdentity): Promise<ConversationRecord>;
  save(record: ConversationRecord): Promise<ConversationRecord>;
  delete(conversation: ConversationIdentity): Promise<boolean>;
}

export interface SlackChannelData {
  SlackMessage: {
    team_id: string;
    api_app_id: string;
    thread_ts?: string;
    ts?: string;
    event: {
      user: string;
      channel: string;
      team: string;
      thread_ts?: string;
      ts?: string;
    };
  };
}
