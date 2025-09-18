export const DeleteModalType = 'directory-delete-model';
export const EditModalType = 'directory-edit-modal';
export const AddModalType = 'directory-add-modal';

export interface Directory {
  directory: Service[];
  resourceType: Record<string, ResourceType[]>;
  resourceTypeInCore: Record<string, ResourceType[]>;
}

export interface Service {
  name?: string;
  namespace: string;
  service?: string;
  api?: string;
  url: string;
  urn?: string;
  metadata?: Metadata;
  isCore?: boolean;
  loaded?: boolean;
  hasApi?: boolean;
}

export interface Metadata {
  name?: string;
  description?: string;
  _links?: Links;
}
export interface Links {
  self: { href: string };
  docs?: { href: string };
  api?: { href: string };
  health?: { href: string };
}

export const defaultService: Service = {
  namespace: '',
  url: '',
  service: '',
  api: '',
  urn: '',
};

export const DIRECTORY_INIT: Directory = {
  directory: [],
  resourceType: {},
  resourceTypeInCore: {},
};

export interface ResourceTag {
  urn: string;
  label: string;
}

export interface Resource {
  urn: string;
  name: string;
  description: string;
  id: string;
  type: string;
  _embedded?: {
    represents?: unknown;
    tags?: Tag[];
  };
}

export interface ResourceTagFilterCriteria {
  typeEquals?: string;
  urnEquals?: string;
  top?: number;
}

export interface Tag {
  value: string;
  label: string;
}

export interface ResourceRequest {
  urn: string;
  name?: string;
  description?: string;
  type?: string;
  _embedded?: {
    represents?: unknown;
    tags?: Tag[];
  };
}

export interface ResourceTagRequest {
  tag: Tag;
  resource: ResourceRequest;
}

export interface ResourceTagResult {
  urn: string;
  label: string;
  value: string;
  _links: Record<string, unknown>;
}

export interface ResourceType {
  id?: string;
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

export const defaultResourceType: ResourceType = {
  id: '',
  type: '',
  matcher: '',
  namePath: '',
  descriptionPath: '',
  deleteEvent: {
    namespace: '',
    name: '',
    resourceIdPath: '',
  },
};
export type ResourceTypeObjectType = Record<string, ResourceType>;
