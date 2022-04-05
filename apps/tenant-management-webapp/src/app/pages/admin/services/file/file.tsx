import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import FileOverview from './fileOverview';
import { FileTypes } from './fileTypes';
import FileList from './fileList';
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
      <a rel="noopener noreferrer" target="_blank" href={`${docBaseUrl}/${tenantName}?urls.primaryName=File service`}>
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

export const File: FunctionComponent = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <Page>
      <Main>
        <>
          <h1 data-testid="file-title">Files</h1>
          <Tabs activeIndex={activeIndex}>
            <Tab label="Overview">
              <FileOverview
                onSwitch={() => {
                  setActiveIndex(1);
                }}
              />
            </Tab>
            <Tab label="File types">
              <FileTypes />
            </Tab>
            <Tab label="Test files">
              <FileList />
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
