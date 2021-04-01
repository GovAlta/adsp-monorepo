export interface Results<T> {
  results: T[];
  page: {
    after: string;
    size: number;
    next?: string;
  };
}
