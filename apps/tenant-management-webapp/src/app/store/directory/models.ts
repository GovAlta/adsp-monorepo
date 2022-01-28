export interface Directory {
  directory: Services[];
}
export interface Services {
  name: string;
  namespace: string;
  url: string;
}
export const DIRECTORY_INIT: Directory = {
  directory: [],
};
