import { InstallationStore } from '@slack/oauth';
import { Channels } from 'botbuilder';

export interface SlackRepository extends InstallationStore {
  getInstalledTeams(): Promise<{ id: string; name: string }[]>;
}

export interface ConversationIdentity {
  channelId: Channels;
  tenantId: string;
  conversationId: string;
}

export interface ConversationRecord extends ConversationIdentity {
  serviceUrl: string;
}

export interface BotRepository {
  get(conversation: ConversationIdentity): Promise<ConversationRecord>;
  save(record: ConversationRecord): Promise<ConversationRecord>;
}
