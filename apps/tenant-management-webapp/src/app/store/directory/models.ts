export const DeleteModalType = 'directory-delete-model';
export const EditModalType = 'directory-edit-modal';
export const AddModalType = 'directory-add-modal';

export interface Directory {
  directory: Service[];
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
};
