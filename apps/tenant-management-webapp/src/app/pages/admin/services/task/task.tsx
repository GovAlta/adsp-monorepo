import React, { useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';

import AsideLinks from '@components/AsideLinks';
import { TaskserviceOverview } from './taskOverview';

function Task(): JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  function getTasksupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/task-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="status-title">Task service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <TaskserviceOverview setActiveIndex={setActiveIndex} />
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
}
export default Task;
