import React, { FunctionComponent, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { QueuesList } from './queuesList';
import { TasksList } from './tasksList';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { TaskOverview } from './taskOverview';
import AsideLinks from '@components/AsideLinks';

export const Task: FunctionComponent = () => {
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const getTaskSupportCodeLink = () => {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/task-service';
  };
  const getTaskDocsLink = () => {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Task service`;
  };
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
          <AsideLinks serviceLink={getTaskSupportCodeLink()} docsLink={getTaskDocsLink()} />
        </>
      </Aside>
    </Page>
  );
};
