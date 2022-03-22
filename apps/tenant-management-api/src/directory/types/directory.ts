export interface Service {
  service: string;
  api?: string;
  host: string;
  description?: string;
  metadata?: Links;
}
export interface Directory {
  id?: string;
  name: string;
  services: Service[];
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
export interface Criteria {
  name: { $regex: string; $options: 'i' };
}
