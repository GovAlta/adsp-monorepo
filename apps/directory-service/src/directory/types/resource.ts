import { AdspId } from '@abgov/adsp-service-sdk';

export interface Tag {
  tenantId: AdspId;
  label: string;
  value: string;
}

export interface Resource {
  tenantId: AdspId;
  urn: AdspId;
  name?: string;
  description?: string;
}

export interface TagCriteria {
  tenantIdEquals?: AdspId;
  resourceUrnEquals?: AdspId;
}

export interface ResourceTypeConfiguration {
  type: string;
  matcher: string;
  namePath: string;
  descriptionPath?: string;
}
