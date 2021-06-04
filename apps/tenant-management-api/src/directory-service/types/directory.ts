export interface Service {
  service: string;
  host: string;
}
export interface Directory {
  id: string;
  name: string;
  services: Service[];
}
