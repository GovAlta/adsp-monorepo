import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';

import FileOverview from './fileOverview';
import { FileTypes } from './fileTypes';
import FileList from './fileList';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import SupportLinks from '@components/SupportLinks';

const HelpLink = (): JSX.Element => {
  const tenantId = useSelector((state: RootState) => state.tenant?.id);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  return (
    <>
      <h3>Helpful links</h3>
      <a
        rel="noopener noreferrer"
        target="_blank"
        href={`${docBaseUrl}?tenant=${tenantId}&urls.primaryName=File service`}
      >
        Read the API docs
      </a>
      <br />
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://gitlab.gov.ab.ca/dio/core/core-services/-/tree/master/apps/file-service"
      >
        See the code
      </a>
      <SupportLinks />
    </>
  );
};

export const File: FunctionComponent = () => {
  return (
    <Page>
      <Main>
        <>
          <h1>File service</h1>
          <Tabs activeIndex={0}>
            <Tab label="Overview">
              <FileOverview />
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
