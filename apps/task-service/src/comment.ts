import { ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { CommentService, Task } from './task';

class CommentServiceImpl implements CommentService {
  private commentTopicUrl: URL;
  constructor(
    private logger: Logger,
    private tokenProvider: TokenProvider,
    commentServiceUrl: URL,
    private topicTypeId: string
  ) {
    this.commentTopicUrl = new URL('/comment/v1/topics', commentServiceUrl);
  }
  async createTopic(task: Task, urn: string): Promise<void> {
    try {
      this.logger.debug(`Creating comment topic for task (${urn})...`);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ urn: string }>(
        this.commentTopicUrl.href,
        {
          typeId: this.topicTypeId,
          resourceId: urn,
          name: `Task ${task.name} (ID: ${task.id}) comments`,
          description: `Topic created by task service for comments related to task ${task.name} (ID: ${task.id}) in queue ${task.queue.namespace}:${task.queue.name}.`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: task.tenantId.toString() },
        }
      );
      this.logger.info(`Created comment topic for task (${urn}) at ${data.urn}.`);
    } catch (err) {
      this.logger.error(`Failed to create comment topic for task (${urn}): ${err}`);
    }
  }
}

interface CommentServiceProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  topicTypeId: string;
}

const commentServiceId = adspId`urn:ads:platform:comment-service`;
export async function createCommentService({
  logger,
  directory,
  tokenProvider,
  topicTypeId,
}: CommentServiceProps): Promise<CommentService> {
  const commentServiceUrl = await directory.getServiceUrl(commentServiceId);
  return new CommentServiceImpl(logger, tokenProvider, commentServiceUrl, topicTypeId);
}
