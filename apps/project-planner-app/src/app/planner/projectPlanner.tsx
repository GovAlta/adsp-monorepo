import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Page, Main } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import BetaBadge from '@icons/beta-badge.svg';
import { selectIsPlannerAdmin } from '@store/session/selectors';
import { HeadingDiv } from '../styled-components';
import { PlannerOverview } from './overview';
import { SolutionsWorkspace } from './SolutionsWorkspace';
import { Patterns } from './patterns';

const ADMIN_TABS = ['overview', 'solutions', 'patterns'];
const USER_TABS = ['overview', 'solutions'];

const TabsSpacing = styled.div`
  > div:first-child {
    margin-bottom: 1rem;
  }
`;

export const ProjectPlanner: FunctionComponent = () => {
  const { tab, id } = useParams<{ tab?: string; id?: string }>();
  const navigate = useNavigate();
  const isPlannerAdmin = useSelector(selectIsPlannerAdmin);
  const tabs = isPlannerAdmin ? ADMIN_TABS : USER_TABS;
  const activeTab = id ? 'solutions' : tab;
  const activeIndex = Math.max(tabs.indexOf(activeTab), 0);
  const changeTab = (index: number) => navigate(`../${tabs[index]}`);

  if (id) {
    return (
      <Page>
        <Main>
          <SolutionsWorkspace />
        </Main>
      </Page>
    );
  }

  return (
    <Page>
      <Main>
        <HeadingDiv>
          <h1 data-testid="project-planner-title">Project planner service</h1>
          <img src={BetaBadge} alt="Beta" />
        </HeadingDiv>
        <TabsSpacing>
          <Tabs activeIndex={activeIndex} changeTabCallback={changeTab}>
            <Tab label="Overview" data-testid="project-planner-overview-tab">
              <PlannerOverview onStart={() => navigate('../solutions')} />
            </Tab>
            <Tab label="Solutions" data-testid="project-planner-solutions-tab">
              <SolutionsWorkspace />
            </Tab>
            {isPlannerAdmin && (
              <Tab label="Patterns" data-testid="project-planner-patterns-tab">
                <Patterns />
              </Tab>
            )}
          </Tabs>
        </TabsSpacing>
      </Main>
    </Page>
  );
};
