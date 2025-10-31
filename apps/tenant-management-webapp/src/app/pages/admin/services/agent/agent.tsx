import { FunctionComponent, useState } from 'react';
import AsideLinks from '@components/AsideLinks';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import BetaBadge from '@icons/beta-badge.svg';
import { Agents } from './agents';
import { AgentOverview } from './overview';

export const Agent: FunctionComponent = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [openAddAgent, setOpenAddAgent] = useState<boolean>(false);

  return (
    <Page>
      <Main>
        <div>
          <h1 data-testid="cache-title">
            Agent service
            <img src={BetaBadge} alt="Beta" />
          </h1>
        </div>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview" data-testid="agent-service-overview-tab">
            <AgentOverview setActiveIndex={setActiveIndex} setOpenAddAgent={setOpenAddAgent} />
          </Tab>
          <Tab label="Agents" data-testid="agent-service-agents-tab">
            <Agents openAddAgent={openAddAgent} setOpenAddAgent={setOpenAddAgent} />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsideLinks serviceName="agent" />
      </Aside>
    </Page>
  );
};
