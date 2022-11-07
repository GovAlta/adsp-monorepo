import React, { useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ScriptOverview } from './overview';
import SupportLinks from '@components/SupportLinks';
import BetaBadge from '@icons/beta-badge.svg';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { ScriptsView } from './scriptsView';
import { HeadingDiv } from './styled-components';
export const Script = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
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
            <h1 data-testid="calendar-title">Script service</h1> <img src={BetaBadge} alt="Files Service" />
          </HeadingDiv>
          <Tabs activeIndex={activeIndex}>
            <Tab label="Overview">
              <ScriptOverview setActiveIndex={setActiveIndex} setActiveEdit={activateEdit} />
            </Tab>
            <Tab label="Scripts">
              <ScriptsView activeEdit={activateEditState} />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Script service`}
        >
          Read the API docs
        </a>
        <br />
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/script-service"
        >
          See the code
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
