export interface Directory {
  directory: Service[];
}
export interface Service {
  name: string;
  namespace: string;
  api?: string;
  url: string;
  urn?: string;
  description?: string;
  metadata?: Metadata;
  isCore?: boolean;
}
export interface Metadata {
  name?: string;
  description?: string;
  _links?: Links;
}
export interface Links {
  self: string;
  docs?: string;
  api?: string;
  health?: string;
}
export const defaultService: Service = {
  name: '',
  namespace: '',
  url: '',
};

export const DIRECTORY_INIT: Directory = {
  directory: [],
};
