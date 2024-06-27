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

export type RevisionAggregateDoc<C = unknown> = Omit<ConfigurationRevisionDoc<C>, 'namespace' | 'name' | 'tenant'> & {
  _id: Pick<ConfigurationRevisionDoc<C>, 'namespace' | 'name' | 'tenant'>;
};
