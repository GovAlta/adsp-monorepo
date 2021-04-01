import { Observable } from 'rxjs';

export interface WorkItem<T> {
  item: T;
  done: () => void;
}

export interface WorkQueueService<T> {
  enqueue(item: T): Promise<boolean>;
  getItems(): Observable<WorkItem<T>>;
}
