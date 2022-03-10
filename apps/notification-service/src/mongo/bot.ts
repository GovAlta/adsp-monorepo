import { model, Model } from 'mongoose';
import { Logger } from 'winston';
import { BotRepository, ConversationIdentity, ConversationRecord } from '../provider';
import { botSchema } from './schema';

export class MongoBotRepository implements BotRepository {
  private botModel: Model<Document & ConversationRecord>;

  constructor(private logger: Logger) {
    this.botModel = model<Document & ConversationRecord>('bot', botSchema);
  }

  async get({ channelId, tenantId, conversationId }: ConversationIdentity): Promise<ConversationRecord> {
    const doc = await this.botModel.findOne({ channelId, tenantId, conversationId }, null, { lean: true });

    return this.fromDoc(doc);
  }

  async delete({ channelId, tenantId, conversationId }: ConversationIdentity): Promise<boolean> {
    const { deletedCount } = await this.botModel.deleteOne({ channelId, tenantId, conversationId });

    return deletedCount > 0;
  }

  async save(record: ConversationRecord): Promise<ConversationRecord> {
    try {
      const doc = await this.botModel.findOneAndUpdate(
        { channelId: record.channelId, tenantId: record.tenantId, conversationId: record.conversationId },
        this.toDoc(record),
        { lean: true, new: true, upsert: true }
      );

      return this.fromDoc(doc);
    } catch (err) {
      this.logger.error(
        `Failed to save bot conversation record for ${record.channelId}: ${record.tenantId}:${record.conversationId}. ${err}`
      );
      throw err;
    }
  }

  private toDoc({
    channelId,
    tenantId,
    conversationId,
    name,
    serviceUrl,
    botId,
    botName,
  }: ConversationRecord): ConversationRecord {
    // This is a straight copy for now, but in theory the input object could have extraneous properties.
    return { channelId, tenantId, conversationId, name, serviceUrl, botId, botName };
  }

  private fromDoc(doc: ConversationRecord): ConversationRecord {
    return doc
      ? {
          channelId: doc.channelId,
          tenantId: doc.tenantId,
          conversationId: doc.conversationId,
          name: doc.name,
          serviceUrl: doc.serviceUrl,
          botId: doc.botId,
          botName: doc.botName,
        }
      : null;
  }
}
