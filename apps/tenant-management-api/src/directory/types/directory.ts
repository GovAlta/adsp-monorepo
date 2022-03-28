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
  self: { href: string };
  docs?: { href: string };
  api?: { href: string };
  health?: { href: string };
}
export interface Criteria {
  name: { $regex: string; $options: 'i' };
}
