import React, { useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ScriptOverview } from './overview';
import BetaBadge from '@icons/beta-badge.svg';
import { ScriptsView } from './scriptsView';
import { HeadingDiv } from './styled-components';

import AsideLinks from '@components/AsideLinks';

export const Script = (): JSX.Element => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  return (
    <Page>
      <Main>
        <>
          <HeadingDiv>
            <h1 data-testid="script-service-title">Script service</h1> <img src={BetaBadge} alt="Files Service" />
          </HeadingDiv>
          <Tabs activeIndex={activeIndex} data-testid="script-tabs">
            <Tab label="Overview" data-testid="script-overview-tabs">
              <ScriptOverview setActiveIndex={setActiveIndex} setActiveEdit={activateEdit} />
            </Tab>
            <Tab label="Scripts" data-testid="scripts-tab">
              <ScriptsView activeEdit={activateEditState} />
            </Tab>
          </Tabs>
        </>
      </Main>

      <Aside>
        <AsideLinks serviceName="script" />
      </Aside>
    </Page>
  );
};
