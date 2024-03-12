import { AdspId } from '@abgov/adsp-service-sdk';
import { TopicType, Topic } from './types';

type TopicTypeResponse = Omit<TopicType, 'tenantId'>;
export function mapTopicType(type: TopicType): TopicTypeResponse | null {
  return type
    ? {
        id: type.id,
        name: type.name,
        adminRoles: type.adminRoles,
        readerRoles: type.readerRoles,
        commenterRoles: type.commenterRoles,
        securityClassification: type.securityClassification,
      }
    : null;
}

export type TopicResponse = Omit<Topic, 'tenantId' | 'type'> & { type: TopicTypeResponse; urn: string };
export function mapTopic(apiId: AdspId, topic: Topic): TopicResponse {
  return {
    type: mapTopicType(topic.type),
    id: topic.id,
    urn: `${apiId}:/topics/${topic.id}`,
    name: topic.name,
    description: topic.description,
    resourceId: topic.resourceId?.toString(),
    commenters: topic.commenters,
    securityClassification: topic.securityClassification,
  };
}
