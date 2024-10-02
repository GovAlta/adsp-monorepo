import { ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { CommentService, FormEntity } from './form';

class CommentServiceImpl implements CommentService {
  private commentTopicUrl: URL;
  constructor(
    private logger: Logger,
    private tokenProvider: TokenProvider,
    commentServiceUrl: URL,
    private supportTopicTypeId: string
  ) {
    this.commentTopicUrl = new URL('/comment/v1/topics', commentServiceUrl);
  }
  async createSupportTopic(form: FormEntity, urn: string): Promise<void> {
    try {
      this.logger.debug(`Creating support topic for form (${urn})...`);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ urn: string }>(
        this.commentTopicUrl.href,
        {
          typeId: this.supportTopicTypeId,
          resourceId: urn,
          name: `Form (${form.id})`,
          description: `Topic created by form service for support questions related to form ${form.definition.name} (ID: ${form.id}).`,
          // The user that created the form is either the applicant or the intake application.
          commenters: [form.createdBy.id],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: form.tenantId.toString() },
        }
      );
      this.logger.info(`Created comment topic for form (${urn}) at ${data.urn}.`);
    } catch (err) {
      this.logger.error(
        `Failed to create comment topic for form (${urn}): ${
          axios.isAxiosError(err) ? err.response?.data?.errorMessage || err.message : err
        }`
      );
    }
  }
}

const commentServiceId = adspId`urn:ads:platform:comment-service`;
export async function createCommentService(
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  supportTopicTypeId: string
): Promise<CommentService> {
  const commentServiceUrl = await directory.getServiceUrl(commentServiceId);
  return new CommentServiceImpl(logger, tokenProvider, commentServiceUrl, supportTopicTypeId);
}
