import React, { FunctionComponent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AsideLinks from '@components/AsideLinks';
import { Page, Main, Aside, AsidePadding } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import BetaBadge from '@icons/beta-badge.svg';
import { HeadingDiv } from '../styled-components';
import { PlannerOverview } from './overview';
import { Solutions } from './solutions';
import { Patterns } from './patterns';

const TABS = ['overview', 'solutions', 'patterns'];

export const ProjectPlanner: FunctionComponent = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeIndex = Math.max(TABS.indexOf(tab), 0);

  return (
    <Page>
      <Main>
        <HeadingDiv>
          <h1 data-testid="project-planner-title">Project planner service</h1>
          <img src={BetaBadge} alt="Beta" />
        </HeadingDiv>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview" data-testid="project-planner-overview-tab">
            <PlannerOverview onStart={() => navigate('../solutions')} />
          </Tab>
          <Tab label="Solutions" data-testid="project-planner-solutions-tab">
            <Solutions />
          </Tab>
          <Tab label="Patterns" data-testid="project-planner-patterns-tab">
            <Patterns />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsidePadding>
          <AsideLinks serviceName="project-planner" noDocsLink />
        </AsidePadding>
      </Aside>
    </Page>
  );
};
