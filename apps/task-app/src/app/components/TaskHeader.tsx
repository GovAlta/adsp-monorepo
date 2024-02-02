import { GoABadge, GoAButton, GoADivider } from '@abgov/react-components-new';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { Task } from '../state';

interface TaskHeaderProps {
  className?: string;
  open: Task;
  isLive: boolean;
  onClickTasks: () => void;
}

const TaskHeaderComponent: FunctionComponent<TaskHeaderProps> = ({ className, open, isLive, onClickTasks }) => {
  return (
    <React.Fragment>
      <div className={className}>
        {open ? (
          <>
            <GoAButton type="tertiary" size="compact" onClick={onClickTasks}>
              Tasks
            </GoAButton>
            <span>/</span>
            <span>
              {open?.name}
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
      <GoADivider />
    </React.Fragment>
  );
};

export const TaskHeader = styled(TaskHeaderComponent)`
  height: 55px;
  background: white;
  z-index: 1;
  flex-grow: 0;
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  > span {
    margin: auto 14px auto 0;
  }
  > :first-child {
    margin: auto 0 auto 5px;
  }

  > span:first-child {
    margin-left: 14px;
  }

  > :last-child {
    margin-left: auto;
  }
`;
