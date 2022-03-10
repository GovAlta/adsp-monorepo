export interface Directory {
  directory: Service[];
}
export interface Service {
  name: string;
  namespace: string;
  api?: string;
  url: string;
}
export const defaultService: Service = {
  name: '',
  namespace: '',
  api: '',
  url: '',
};

export const DIRECTORY_INIT: Directory = {
  directory: [],
};
