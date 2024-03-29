export interface UserInformation {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const OPERATION_START = 'start';
export const OPERATION_COMPLETE = 'complete';
export const OPERATION_CANCEL = 'cancel';
export const OPERATION_SET_PRIORITY = 'set-priority';
export const OPERATION_ASSIGN = 'assign';

export interface StartTaskOperation {
  operation: typeof OPERATION_START;
}

export interface CompleteTaskOperation {
  operation: typeof OPERATION_COMPLETE;
}

export interface CancelTaskOperation {
  operation: typeof OPERATION_CANCEL;
  reason?: string;
}

export interface SetTaskPriorityOperation {
  operation: typeof OPERATION_SET_PRIORITY;
  priority: string;
}

export interface AssignOperation {
  operation: typeof OPERATION_ASSIGN;
  assignTo: {
    id: string;
    name: string;
    email: string;
  };
}

export type TaskOperations =
  | StartTaskOperation
  | CompleteTaskOperation
  | CancelTaskOperation
  | SetTaskPriorityOperation
  | AssignOperation;
