import { InvalidOperationError } from '@core-services/core-common';
import { Installation, InstallationQuery, InstallationStore, Logger } from '@slack/oauth';
import { Document, model, Model } from 'mongoose';
import { slackSchema } from './schema';

interface InstallationDoc {
  id: string;
  workspace: string;
  installation: Omit<Installation, 'enterprise'>;
}

export class MongoSlackInstallationStore implements InstallationStore {
  private slackModel: Model<Document & InstallationDoc>;

  constructor() {
    this.slackModel = model<Document & InstallationDoc>('slack', slackSchema);
  }

  async storeInstallation(installation: Installation, logger?: Logger): Promise<void> {
    if (installation.isEnterpriseInstall) {
      throw new InvalidOperationError('Enterprise installation not supported.');
    }

    const { enterprise: _enterprise, ...record } = installation;

    return await new Promise<void>((resolve, reject) => {
      this.slackModel
        .findOneAndUpdate(
          { id: installation.team.id },
          { id: installation.team.id, workspace: installation.team.name, installation: record },
          { upsert: true, lean: true, new: true }
        )
        .exec((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

  async fetchInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger
  ): Promise<Installation> {
    const docQuery: Record<string, unknown> = {};

    if (query.teamId) {
      docQuery.id = query.teamId;
    }

    return await new Promise<Installation>((resolve, reject) => {
      this.slackModel.findOne(docQuery).exec((err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc.installation as Installation);
        }
      });
    });
  }

  async deleteInstallation(query: InstallationQuery<boolean>, logger?: Logger): Promise<void> {
    if (query.teamId) {
      await new Promise<void>((resolve, reject) => {
        this.slackModel.deleteOne({ id: query.teamId }).exec((err) => (err ? reject(err) : resolve()));
      });
    }
  }
}
