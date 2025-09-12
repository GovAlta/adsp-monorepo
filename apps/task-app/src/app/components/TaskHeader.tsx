import { GoABadge, GoADivider } from '@abgov/react-components';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { Task, tenantSelector } from '../state';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

interface TaskHeaderProps {
  className?: string;
  open: Task;
  isLive: boolean;
  onClickTasks: () => void;
  namespace?: string;
  name?: string;
}

const TaskHeaderComponent: FunctionComponent<TaskHeaderProps> = ({
  className,
  open,
  isLive,
  namespace,
  name,
  onClickTasks,
}) => {
  const tenant = useSelector(tenantSelector);
  return (
    <React.Fragment>
      <div className={className}>
        {open ? (
          <>
            <Link to={`/${tenant.name}/${namespace}/${name}`} onClick={onClickTasks}>
              Tasks ({namespace}:{name})
            </Link>
            <span> /</span>
            <span> {open?.name}</span>
          </>
        ) : (
          <span>
            <a href={`/${tenant.name}`}>Queues</a> / {`Tasks ${namespace ? `(${namespace}:${name})` : ''}`}
          </span>
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
  z-index: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 var(--goa-space-l);
  > span {
    margin: auto 0 auto 5px;
  }

  > span:first-child {
    margin-left: 14px;
  }

  > :last-child {
    margin-left: auto;
  }
`;
