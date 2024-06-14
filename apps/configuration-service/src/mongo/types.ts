export interface ConfigurationRevisionDoc<C = unknown> {
  namespace: string;
  name: string;
  tenant?: string;
  anonymousRead?: boolean;
  revision: number;
  created?: Date;
  lastUpdated?: Date;
  configuration: C;
}

export interface ActiveRevisionDoc {
  namespace: string;
  name: string;
  anonymousRead?: boolean;
  tenant?: string;
  active: number;
}
