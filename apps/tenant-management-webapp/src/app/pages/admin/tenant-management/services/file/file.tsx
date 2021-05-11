import React, { useEffect } from 'react';
import '@abgov/react-components/react-components.esm.css';
import { useSelector, useDispatch } from 'react-redux';

import FileOverview from './fileOverview';
import FileHeader from './fileHeader';
import FileTypes from './fileTypes';
import FileSettings from './fileSettings';
import FileDoc from './fileDocs';
import FileList from './fileList';
import './file.css';
import InitSetup from './fileInitSetup';
import { RootState } from '@store/index';
import { Main } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { FetchTenantConfigService } from '@store/tenantConfig/actions';
import { FetchFileSpaceService } from '@store/file/actions';
const Templates = () => {
  return (
    <div>
      <p>test</p>
    </div>
  );
};

const Usage = () => {
  return (
    <div>
      <p>TODO</p>
    </div>
  );
};

const APIIntegration = () => {
  return (
    <div>
      <p>TODO</p>
    </div>
  );
};

const TabsForSetup = (props: any) => {
  return (
    <Tabs>
      <Tab label="Overview">
        <FileOverview isActive={props.isActive} isEnabled={props.isEnabled} />
      </Tab>

      <Tab label="Space Config">{}</Tab>

      <Tab label="Templates">
        <Templates />
      </Tab>

      <Tab label="Usage">
        <Usage />
      </Tab>
      <Tab label="File List">
        <FileList />
      </Tab>
      <Tab label="API integration">
        <APIIntegration />
      </Tab>

      <Tab label="File Types">
        <FileTypes />
      </Tab>

      <Tab label="Settings">
        <FileSettings />
      </Tab>

      <Tab label="Document">
        <FileDoc />
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
    </Tabs>
  );
};

export default function File() {
  const dispatch = useDispatch();
  const tenantConfig = useSelector((state: RootState) => state.tenantConfig);
  const setupRequired = Object.keys(tenantConfig).length === 0 && !('fileService' in tenantConfig);
  const space = useSelector((state: RootState) => state.fileService.space);
  useEffect(() => {
    dispatch(FetchTenantConfigService());
    dispatch(FetchFileSpaceService());
  }, [dispatch]);
  const isActive = tenantConfig.fileService?.isActive;
  const isEnabled = tenantConfig.fileService?.isEnabled && space !== null;

  return (
    <Main>
      <FileHeader isSetup={setupRequired} isActive={isActive} />
      {setupRequired ? <TabsForInit /> : <TabsForSetup isActive={isActive} isEnabled={isEnabled} />}
    </Main>
  );
}
