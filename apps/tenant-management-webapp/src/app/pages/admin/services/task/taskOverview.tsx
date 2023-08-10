import React, { FunctionComponent, useEffect } from 'react';
import styled from 'styled-components';

interface TaskOverviewProps {
  setActiveIndex: (number) => void;
}

export const TaskserviceOverview: FunctionComponent<TaskOverviewProps> = (props) => {
  const { setActiveIndex } = props;

  useEffect(() => {
    setActiveIndex(0);
  }, []);

  return (
    <OverviewCss>
      <section>
        <p>
          The task service provides a model for tasks, task queues, and task assignment. Applications can use the task
          service for work management as an aspect to augment domain specific concepts and processes.
        </p>
      </section>
    </OverviewCss>
  );
};

const OverviewCss = styled.div`
  .contact-border {
    padding: 1rem;
    border: 1px solid #ccc;
  }

  .left-float {
    float: left;
  }
`;
