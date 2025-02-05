export interface SerializedAxiosError {
  status: number;
  message: string;
}

export interface PagedResults<T> {
  results: T[];
  page: {
    after: string;
    next: string;
  };
}
