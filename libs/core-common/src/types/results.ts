export interface Results<T> {
  results: T[];
  page: {
    after: string | number;
    size: number;
    next?: string;
    total?: number;
  };
}
