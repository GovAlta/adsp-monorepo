import { Aside, Main, Page } from '@components/Html';

import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import { FeedbackOverview } from './overview';
import { FeedbackSites } from './sites/sites';
import { FeedbacksList } from './feedback/feedbacks';
import { FeedbackGuidance } from './guidance';

import AsideLinks from '@components/AsideLinks';
export const FeedbackTabs: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const [activateEdit, setActiveEdit] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);

  const sites = tenantName && searchParams.get('sites');

  return (
    <Page>
      <Main>
        <h1 data-testid="feedback-title">Feedback service</h1>
        <Tabs activeIndex={sites === 'true' ? 1 : 0} data-testid="feedbacks-tabs">
          <Tab label="Overview" data-testid="feedbacks-overview-tab">
            <FeedbackOverview setActiveEdit={setActiveEdit} />
          </Tab>
          <Tab label="Feedback" data-testid="feedbacks-tab">
            <FeedbacksList />
          </Tab>
          <Tab label="Sites" data-testid="feedback-sites-tab">
            <FeedbackSites activeEdit={activateEdit} />
          </Tab>

          <Tab label="Guidance" data-testid="feedbacks-overview-tab">
            <FeedbackGuidance setActiveEdit={setActiveEdit} />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsideLinks serviceName="feedback" feedbackTutorialLink={true} />
      </Aside>
    </Page>
  );
};
