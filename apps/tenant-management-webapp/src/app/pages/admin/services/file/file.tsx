import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import FileOverview from './fileOverview';
import { FileTypes } from './fileTypes/fileTypes';
import FileList from './uploadedFiles/fileList';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';

import AsideLinks from '@components/AsideLinks';

const HelpLink = (): JSX.Element => {
  return <AsideLinks serviceName="file" />;
};

export const File: FunctionComponent = () => {
  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const [openAddFileType, setOpenAddFileType] = useState(false);

  const activateEdit = (edit: boolean) => {
    setActivateEditState(edit);
  };

  const searchParams = new URLSearchParams(document.location.search);
  const fileTypes = tenantName && searchParams.get('fileTypes');

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  return (
    <Page>
      <Main>
        <>
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
