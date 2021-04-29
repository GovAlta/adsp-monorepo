import React, { useEffect } from 'react';
import '@abgov/react-components/react-components.esm.css';
import { useSelector, useDispatch } from 'react-redux';

import FileOverview from './fileOverview';
import FileHeader from './fileHeader';
import FileTypes from './fileTypes';
import FileSettings from './fileSettings';
import FileList from './fileList';
import './file.css';
import InitSetup from './fileInitSetup';
import { RootState } from '@store/index';
import { Main } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';

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

const TabsForSetup = () => {
  return (
    <Tabs>
      <Tab label="Overview">
        <FileOverview />
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
  const setupRequired = useSelector((state: RootState) => state.fileService.requirements.setup);
  const active = useSelector((state: RootState) => state.fileService.status.isActive);

  useEffect(() => {
    //dispatch(FetchFileSpace()); - I'm always getting a 401 here (from tenant-manangement-api)
  }, [dispatch]);

  const FileOverviewTab = setupRequired ? <TabsForInit /> : <TabsForSetup />;

  return (
    <Main>
      <FileHeader />
      {active ? FileOverviewTab : <FileOverview />}
    </Main>
  );
}
