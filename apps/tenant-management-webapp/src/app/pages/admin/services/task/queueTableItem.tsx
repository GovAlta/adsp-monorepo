import React from 'react';
import { TaskDefinition } from '@store/task/model';
import { GoABadge } from '@abgov/react-components-new';
import { OverflowWrap } from './styled-components';

interface QueueTableItemProps {
  queue: TaskDefinition;
  onDelete?: (TaskDefinition) => void;
}

export const QueueTableItem = ({ queue, onDelete }: QueueTableItemProps): JSX.Element => {
  return (
    <>
      <tr>
        <td data-testid="queue-list-namespace">{queue.namespace}</td>
        <td data-testid="queue-list-name">{queue.name}</td>

        <td data-testid="queue-list-assigner-roles">
          <OverflowWrap>
            {queue?.assignerRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="queue-list-worker-roles">
          <OverflowWrap>
            {queue.workerRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="queue-list-action"></td>
      </tr>
    </>
  );
};
