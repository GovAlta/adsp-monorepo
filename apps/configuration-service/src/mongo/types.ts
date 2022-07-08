export interface ConfigurationRevisionDoc<C = unknown> {
  namespace: string;
  name: string;
  tenant?: string;
  revision: number;
  configuration: C;
  active: number;
}
