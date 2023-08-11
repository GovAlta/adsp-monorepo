import React, { Component } from 'react';
import styled from 'styled-components';

interface TaskOverviewProps {
  setActiveIndex?: number;
}

class TaskserviceOverview extends Component<TaskOverviewProps> {
  static defaultProps: TaskOverviewProps = {
    setActiveIndex: 0,
  };

  render() {
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
  }
}

export default TaskserviceOverview;

const OverviewCss = styled.div`
  .contact-border {
    padding: 1rem;
    border: 1px solid #ccc;
  }

  .left-float {
    float: left;
  }
`;
