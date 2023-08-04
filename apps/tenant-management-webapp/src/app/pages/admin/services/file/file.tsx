import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import FileOverview from './fileOverview';
import { FileTypes } from './fileTypes';
import FileList from './fileList';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';

import AsideRight from '@components/AsideRight';

const HelpLink = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  function getFileDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=File service`;
  }
  function getFilesupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/file-service';
  }
  return <AsideRight serviceLink={getFilesupportcodeLink()} docsLink={getFileDocsLink()} />;
};

export const File: FunctionComponent = () => {
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
          <h1 data-testid="file-title">File service</h1>
          <Tabs activeIndex={activeIndex}>
            <Tab label="Overview">
              <FileOverview setActiveIndex={setActiveIndex} setActiveEdit={activateEdit} />
            </Tab>
            <Tab label="File types">
              <FileTypes activeEdit={activateEditState} />
            </Tab>
            <Tab label="Uploaded files">
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
