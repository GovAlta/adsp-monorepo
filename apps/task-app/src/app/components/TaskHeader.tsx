import { GoABadge, GoAButton, GoADivider } from '@abgov/react-components-new';
import React, { FunctionComponent } from 'react';
import { Task } from '../state';

interface TaskHeaderProps {
  className?: string;
  open: Task;
  isLive: boolean;
  onClickTasks: () => void;
}

export const TaskHeader: FunctionComponent<TaskHeaderProps> = ({ className, open, isLive, onClickTasks }) => {
  return (
    <React.Fragment>
      <div className={className}>
        {open ? (
          <>
            <GoAButton mt="s" type="tertiary" onClick={onClickTasks}>
              Tasks
            </GoAButton>
            <span>/</span>
            <span>
              {open?.name} - {open?.description}
            </span>
          </>
        ) : (
          <span>Tasks</span>
        )}
        <span>
          {isLive ? (
            <GoABadge mt="m" mb="s" type="success" content="Live" />
          ) : (
            <GoABadge mt="m" mb="s" type="information" content="Not live" />
          )}
        </span>
      </div>
      <GoADivider mb="m" />
    </React.Fragment>
  );
};
