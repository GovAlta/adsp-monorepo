import type { ContentType } from '../types';
export declare const isAllowedContentTypesForRelations: (contentType: Partial<Pick<ContentType, 'kind' | 'restrictRelationsTo'>>) => boolean;
