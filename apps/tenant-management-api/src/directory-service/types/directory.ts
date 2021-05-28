export interface Service {
  _id: string;
  service: string;
  host: string;
}
export interface Directory {
  _id: string;
  name: string;
  services: Service[];
}
