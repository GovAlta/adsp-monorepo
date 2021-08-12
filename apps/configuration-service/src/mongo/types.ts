export interface ConfigurationRevisionDoc<C = unknown> {
  namespace: string;
  service: string;
  tenant?: string;
  revision: number;
  configuration: C;
}
