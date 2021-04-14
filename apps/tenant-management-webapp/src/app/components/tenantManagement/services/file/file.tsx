import React, { useEffect } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import '@abgov/react-components/react-components.esm.css';
import { useSelector, useDispatch } from 'react-redux';

import FileOverview from './fileOverview';
import FileHeader from './fileHeader';
import FileTypes from './fileTypes';
import FileSettings from './fileSettings';
import './file.css';
import InitSetup from './fileInitSetup';
import { RootState } from '@store/index';
import { FetchFileSpace, SetActiveTab, FetchFileSpaceFromFileApiService } from '@store/file/actions';

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
  const { isActive, activeTab } = useSelector((state: RootState) => ({
    isActive: state.file.status.isActive,
    activeTab: state.file.states.activeTab,
  }));

  const dispatch = useDispatch();

  return (
    <Tabs
      defaultActiveKey="overall-view"
      id="admin-file-service-tab"
      className="file-tab"
      activeKey={activeTab}
      onSelect={(key) => dispatch(SetActiveTab(key))}
    >
      <Tab eventKey="overall-view" title="Overview">
        <FileOverview />
      </Tab>

      <Tab eventKey="space" title="Space Config" disabled={!isActive}></Tab>

      <Tab eventKey="templates" title="Templates" disabled={!isActive}>
        <Templates />
      </Tab>

      <Tab eventKey="usage" title="Usage" disabled={!isActive}>
        <Usage />
      </Tab>

      <Tab eventKey="api-integration" title="API integration" disabled={!isActive}>
        <APIIntegration />
      </Tab>

      <Tab eventKey="file-types" title="File Types" disabled={!isActive}>
        <FileTypes />
      </Tab>

      <Tab eventKey="file-setting" title="Settings" disabled={!isActive}>
        <FileSettings />
      </Tab>
    </Tabs>
  );
};

const TabsForInit = () => {
  const activeTab = useSelector((state: RootState) => state.file.states.activeTab);

  return (
    <Tabs defaultActiveKey="overall-view" id="admin-file-service-tab" className="file-tab" activeKey={activeTab}>
      <Tab eventKey="overall-view" title="Overview">
        <InitSetup />
      </Tab>
    </Tabs>
  );
};

export default function File() {
  const dispatch = useDispatch();
  const setupRequired = useSelector((state: RootState) => state.file.requirements.setup);

  useEffect(() => {
    dispatch(FetchFileSpace());
    dispatch(FetchFileSpaceFromFileApiService());
  }, [dispatch]);

  const FileOverviewTab = setupRequired ? <TabsForInit /> : <TabsForSetup />;

  return (
    <div>
      <Container>
        <FileHeader />
        {FileOverviewTab}
      </Container>
    </div>
  );
}
