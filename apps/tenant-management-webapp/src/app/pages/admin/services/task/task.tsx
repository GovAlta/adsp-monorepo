import React, { FunctionComponent, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { QueuesList } from './queuesList';
import { TasksList } from './tasksList';
import { TaskOverview } from './taskOverview';
import AsideLinks from '@components/AsideLinks';

export const Task: FunctionComponent = () => {
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  function getTasksupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/task-service';
  }

  const searchParams = new URLSearchParams(document.location.search);

  const queues = searchParams.get('definitions');

  return (
    <Page>
      <Main>
        <h1 data-testid="status-title">Task service</h1>
        <Tabs activeIndex={queues === 'true' ? 1 : 0}>
          <Tab label="Overview">
            <TaskOverview setOpenAddDefinition={setOpenAddDefinition} />
          </Tab>
          <Tab label="Queues">
            <QueuesList openAddDefinition={openAddDefinition} />
          </Tab>
          <Tab label="Tasks">
            <TasksList />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <>
          <AsideLinks serviceLink={getTasksupportcodeLink()} />
        </>
      </Aside>
    </Page>
  );
};
