export enum SecurityClassifications {
  ProtectedA = 'protected a',
  ProtectedB = 'protected b',
  ProtectedC = 'protected c',
  Public = 'public',
}

/**
 * Platform envelope for a page of results using `top` and `after` cursor pagination.
 */
export interface Results<T> {
  results: T[];
  page: {
    after?: string;
    next?: string;
    size: number;
  };
}
