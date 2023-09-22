import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import FileOverview from './fileOverview';
import { FileTypes } from './fileTypes';
import FileList from './fileList';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';

import AsideLinks from '@components/AsideLinks';
import { BodyGlobalStyles } from '../styled-components';

const HelpLink = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  function getFileDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=File service`;
  }
  function getFilesupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/file-service';
  }
  return <AsideLinks serviceLink={getFilesupportcodeLink()} docsLink={getFileDocsLink()} />;
};

export const File: FunctionComponent = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const [openAddFileType, setOpenAddFileType] = useState(false);
  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  const searchParams = new URLSearchParams(document.location.search);
  const fileTypes = tenantName && searchParams.get('fileTypes');

  return (
    <Page>
      <Main>
        <>
          <BodyGlobalStyles hideOverflow={false} />
          <h1 data-testid="file-title">File service</h1>
          <Tabs activeIndex={fileTypes === 'true' ? 1 : 0} data-testid="file-tabs">
            <Tab label="Overview" data-testid="file-overview-tab">
              <FileOverview setOpenAddFileType={setOpenAddFileType} setActiveEdit={activateEdit} />
            </Tab>
            <Tab label="File types" data-testid="file-types-tab">
              <FileTypes openAddFileType={openAddFileType} activeEdit={activateEditState} />
            </Tab>
            <Tab label="Uploaded files" data-testid="file-upload-tab">
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
