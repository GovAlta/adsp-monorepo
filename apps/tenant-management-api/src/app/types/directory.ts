import Directory from '../models/directory/directory';

export interface Serivce {
  service: string;
  host: string;
}
export interface Directory {
  name: string;
  host: Array<Serivce>;
}
