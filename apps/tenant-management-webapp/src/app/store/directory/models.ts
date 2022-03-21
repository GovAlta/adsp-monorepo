export interface Directory {
  directory: Service[];
}
export interface Service {
  name: string;
  namespace: string;
  api?: string;
  url: string;
  description?: string;
  _links?: Links;
  isCore?: boolean;
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
