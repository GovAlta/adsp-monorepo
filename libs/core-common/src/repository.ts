export interface Repository<E extends object, V> {
  delete(entity: E): Promise<boolean>
  get(id: string): Promise<E>
  save(entity: E): Promise<E>
}
