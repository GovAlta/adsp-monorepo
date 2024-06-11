import React, { FunctionComponent, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { QueuesList } from './queuesList';
import { TasksList } from './tasksList';
import { TaskOverview } from './taskOverview';
import AsideLinks from '@components/AsideLinks';
import { useSelector } from 'react-redux';
import { taskAppLoginUrlSelector } from './selectors';
import LinkCopyComponent from '@components/CopyLink/CopyLink';

export const Task: FunctionComponent = () => {
  const loginUrl = useSelector(taskAppLoginUrlSelector);
  const [openAddDefinition, setOpenAddDefinition] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);

  const queues = searchParams.get('definitions');

  return (
    <Page>
      <Main>
        <h1 data-testid="task-title">Task service</h1>
        <Tabs activeIndex={queues === 'true' ? 1 : 0}>
          <Tab label="Overview" data-testid="task-service-overview-tab">
            <TaskOverview setOpenAddDefinition={setOpenAddDefinition} />
          </Tab>
          <Tab label="Queues" data-testid="task-service-queues-tab">
            <QueuesList openAddDefinition={openAddDefinition} />
          </Tab>
          <Tab label="Tasks" data-testid="task-service-tasks-tab">
            <TasksList />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsideLinks serviceName="task" />
        <h3>Work on tasks</h3>
        <span>Users can view and work on tasks in queues here:</span>
        <h3>Task app link</h3>
        <LinkCopyComponent text={'Copy link'} link={loginUrl} />
      </Aside>
    </Page>
  );
};
