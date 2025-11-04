import { FunctionComponent, useState } from 'react';
import AsideLinks from '@components/AsideLinks';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import BetaBadge from '@icons/beta-badge.svg';
import { Agents } from './agents';
import { AgentOverview } from './overview';
import { HeadingDiv } from '../styled-components';
import { useParams } from 'react-router-dom';

export const Agent: FunctionComponent = () => {
  const { tab } = useParams();
  const [activeIndex, setActiveIndex] = useState<number>(tab === 'agents' ? 1 : 0);
  const [openAddAgent, setOpenAddAgent] = useState<boolean>(false);

  return (
    <Page>
      <Main>
        <HeadingDiv>
          <h1 data-testid="agent-title">Agent service</h1>
          <img src={BetaBadge} alt="Beta" />
        </HeadingDiv>
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
