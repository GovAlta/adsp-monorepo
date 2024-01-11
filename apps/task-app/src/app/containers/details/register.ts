import { ComponentClass, FunctionComponent } from 'react';
import { TaskDetailsProps } from './types';
import { Task } from '../../state';

interface RegisteredDetailsComponent {
  order?: number;
  matcher: (task: Task) => boolean;
  detailsComponent: FunctionComponent<TaskDetailsProps> | ComponentClass<TaskDetailsProps>;
}
declare global {
  // eslint-disable-next-line no-var
  var taskDetailsComponents: RegisteredDetailsComponent[];
}

export function registerDetailsComponent(
  matcher: (task: Task) => boolean,
  detailsComponent: FunctionComponent<TaskDetailsProps> | ComponentClass<TaskDetailsProps>,
  order = 0
) {
  if (globalThis.taskDetailsComponents === undefined) {
    globalThis.taskDetailsComponents = [];
  }

  globalThis.taskDetailsComponents.push({ matcher, detailsComponent, order });
}

function isDetailsComponent(value: unknown): value is RegisteredDetailsComponent {
  const meta = value as RegisteredDetailsComponent;
  return typeof meta?.matcher === 'function' && !!meta?.detailsComponent;
}

export function getRegisteredDetailsComponents(): RegisteredDetailsComponent[] {
  return (globalThis.taskDetailsComponents || [])
    .filter(isDetailsComponent)
    .sort(({ order: orderA }, { order: orderB }) => (orderB || 0) - (orderA || 0));
}
