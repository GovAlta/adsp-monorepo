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
  type?: string;
  data?: unknown;
}

export interface TagCriteria {
  tenantIdEquals?: AdspId;
  resourceUrnEquals?: AdspId;
  valueEquals?: string;
}

export interface ResourceTypeConfiguration {
  type: string;
  matcher: string;
  namePath: string;
  descriptionPath?: string;
  deleteEvent?: {
    namespace: string;
    name: string;
    resourceIdPath: string;
  };
}

export interface ResourceCriteria {
  tenantIdEquals?: AdspId;
  urnEquals?: AdspId;
  typeEquals?: string;
}
