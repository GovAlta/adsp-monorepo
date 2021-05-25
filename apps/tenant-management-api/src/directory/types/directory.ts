import Directory from '../models/directory';

export interface Service {
  service: string;
  host: string;
}
export interface Directory {
  name: string;
  services: Service[];
}
