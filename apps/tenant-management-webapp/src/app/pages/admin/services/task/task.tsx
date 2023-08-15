import React, { Component } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import AsideLinks from '@components/AsideLinks';
import TaskserviceOverview from './taskOverview';
import { HeadingDiv } from './styled-components';
import BetaBadge from '@icons/beta-badge.svg';

interface TaskProps {
  activeIndex?: number;
  setActiveIndex?: number;
  getTasksupportcodeLink?: string;
}

class Task extends Component<TaskProps> {
  static defaultProps: TaskProps = {
    setActiveIndex: 0,
    activeIndex: 0,
    getTasksupportcodeLink: 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/task-service',
  };

  render() {
    return (
      <Page>
        <Main>
          <HeadingDiv>
            <h1 data-testid="status-title">Task service</h1>
            <img src={BetaBadge} alt="Task Service" />
          </HeadingDiv>
          <Tabs activeIndex={this.props.activeIndex}>
            <Tab label="Overview">
              <TaskserviceOverview setActiveIndex={this.props.setActiveIndex} />
            </Tab>
          </Tabs>
        </Main>

        <Aside>
          <>
            <AsideLinks serviceLink={this.props.getTasksupportcodeLink} />
          </>
        </Aside>
      </Page>
    );
  }
}
export default Task;
