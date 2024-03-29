// eslint-disable-next-line
export interface Repository<E, V, I = string> {
  delete(entity: E): Promise<boolean>;
  get(id: I, tenantId?: string): Promise<E>;
  save(entity: E): Promise<E>;
}
