export interface ConfigurationRevisionDoc<C = unknown> {
  namespace: string;
  name: string;
  tenant?: string;
  revision: number;
  created?: Date;
  lastUpdated?: Date;
  configuration: C;
}

export interface ActiveRevisionDoc {
  namespace: string;
  name: string;
  tenant?: string;
  active: number;
}
