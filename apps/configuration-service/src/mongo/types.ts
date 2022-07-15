export interface ConfigurationRevisionDoc<C = unknown> {
  namespace: string;
  name: string;
  tenant?: string;
  revision: number;
  created?: Date;
  lastUpdated?: Date;
  configuration: C;
}
