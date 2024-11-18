import React from 'react';
import { TaskDefinition } from '@store/task/model';

import { ConfigTaskWrapper } from '../styled-components';

interface props {
  queue: TaskDefinition;
}
export const TaskConfigQueue = ({ queue }: props) => {
  return (
    <ConfigTaskWrapper data-testid="task-config-form">
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Namespace</th>
            </tr>
            <tr>
              <td data-testid="queue-namespace" className="overflowContainer">
                {queue.namespace}
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="queue-name" className="overflowContainer">
                {queue.name}
              </td>
            </tr>
          </thead>
        </table>
      </div>
    </ConfigTaskWrapper>
  );
};
