import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAPageLoader } from '@abgov/react-components';

import FileOverview from './fileOverview';
import FileHeader from './fileHeader';
import FileTypes from './fileTypes';
import FileDoc from './fileDocs';
import FileList from './fileList';
import './file.css';
import InitSetup from './fileInitSetup';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { FetchTenantConfigService } from '@store/tenantConfig/actions';
import { FetchFileSpaceService } from '@store/file/actions';
import SupportLinks from '@components/SupportLinks';

interface tapProps {
  isActive?: boolean;
}
const TabsForEnable = (props: tapProps): JSX.Element => {
  return (
    <Tabs>
      <Tab label="Overview">
        <FileOverview isActive={props.isActive} />
      </Tab>
      <Tab label="Test Files">
        <FileList />
      </Tab>
      <Tab label="File Types">
        <FileTypes />
      </Tab>
    </Tabs>
  );
};

const TabsForDisable = (props: tapProps) => {
  return (
    <Tabs>
      <Tab label="Overview">
        <FileOverview isActive={props.isActive} />
      </Tab>
    </Tabs>
  );
};

const TabsForInit = () => {
  return (
    <Tabs>
      <Tab label="Overview">
        <InitSetup />
      </Tab>
      <Tab label="Documentation">
        <FileDoc />
      </Tab>
    </Tabs>
  );
};

const HelpLink = (): JSX.Element => {
  const tenantId = useSelector((state: RootState) => state.tenant?.id);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  return (
    <>
      <h5>Helpful Links</h5>
      <a rel="noopener noreferrer" target="_blank" href={`${docBaseUrl}?tenant=${tenantId}&urls.primaryName=File Service`}>
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

export default function File(): JSX.Element {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  const tenantConfig = useSelector((state: RootState) => state.tenantConfig);
  const setupRequired = Object.keys(tenantConfig).length === 0 && !('fileService' in tenantConfig);
  const space = useSelector((state: RootState) => state.fileService.space);
  useEffect(() => {
    dispatch(FetchTenantConfigService());
    dispatch(FetchFileSpaceService());
    setIsLoaded(true);
  }, [dispatch]);
  const isActive = tenantConfig.fileService?.isActive;
  const isEnabled = tenantConfig.fileService?.isEnabled && space !== null;

  return (
    <Page>
      <Main>
        {isLoaded ? (
          <>
            <FileHeader isSetup={setupRequired} isActive={isActive} />
            {setupRequired ? (
              <TabsForInit />
            ) : isEnabled ? (
              <TabsForEnable isActive={isActive} />
            ) : (
              <TabsForDisable isActive={isActive} />
            )}
          </>
        ) : (
          <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
        )}
      </Main>
      <Aside>
        <HelpLink />
      </Aside>
    </Page>
  );
}
