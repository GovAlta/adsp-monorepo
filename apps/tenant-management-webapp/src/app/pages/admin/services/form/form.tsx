import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import FormOverview from './formOverview';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import SupportLinks from '@components/SupportLinks';

const HelpLink = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  return (
    <>
      <h3>Helpful links</h3>
      <a
        rel="noopener noreferrer"
        target="_blank"
        href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=File service`}
      >
        Read the API docs
      </a>
      <br />
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/file-service"
      >
        See the code
      </a>
      <SupportLinks />
    </>
  );
};

export const Form: FunctionComponent = () => {
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
          <h1 data-testid="form-title">Form service</h1>
          <Tabs activeIndex={activeIndex}>
            <Tab label="Overview">
              <FormOverview setActiveIndex={setActiveIndex} setActiveEdit={activateEdit} />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <HelpLink />
      </Aside>
    </Page>
  );
};
