import React, { FunctionComponent, useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { QueuesList } from './queuesList';
import { TaskserviceOverview } from './taskOverview';
import AsideLinks from '@components/AsideLinks';

export const Task: FunctionComponent = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };
  useEffect(() => {
    if (activeIndex !== null) {
      setActiveIndex(null);
    }
  }, [activeIndex]);
  function getTasksupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/task-service';
  }

  return (
    <Page>
      <Main>
        <h1 data-testid="status-title">Task service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <TaskserviceOverview setActiveEdit={activateEdit} setActiveIndex={setActiveIndex} />
          </Tab>
          <Tab label="Queues">
            <QueuesList activeEdit={activateEditState} />
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
