import { Doc } from '@core-services/core-common';
import { Resource, Tag } from '../directory';

export type TagDoc = Doc<Omit<Tag, 'tenantId'> & { tenantId: string }>;

export type ResourceDoc = Doc<Omit<Resource, 'tenantId' | 'urn'> & { tenantId: string; urn: string; }>;
