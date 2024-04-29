import { Aside, Main, Page } from '@components/Html';

import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import { FeedbackOverview } from './overview';

import AsideLinks from '@components/AsideLinks';

export const Feedback: FunctionComponent = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  return (
    <Page>
      <Main>
        <h1 data-testid="feedback-title">Feedback service</h1>
        <Tabs activeIndex={activeIndex} data-testid="feedbacks-tabs">
          <Tab label="Overview" data-testid="feedbacks-overview-tab">
            <FeedbackOverview
              setActiveIndex={(index: number) => {
                setActiveIndex(index);
              }}
              setActiveEdit={activateEdit}
            />
          </Tab>
          <Tab label="Sites" data-testid="feedbacks-definitions-tab">
            Sites List
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsideLinks serviceName="feedback" />
      </Aside>
    </Page>
  );
};
