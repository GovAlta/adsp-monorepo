import React from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import FileOverview from './fileOverview';
import FileHeader from './fileHeader';
import InitSetup from './fileInitSetup';
import FileSpace from './fileSpace';
import FileSettings from './fileSettings';
import { useSelector, useDispatch } from 'react-redux';
import '@abgov/react-components/react-components.esm.css';
import { TYPES } from '../../../../store/actions';
import { RootState } from '../../../../store/reducers';
import './file.css';

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
  const isActive = useSelector(
    (state: RootState) => state.file.status.isActive
  );

  const activeTab = useSelector(
    (state: RootState) => state.file.states.activeTab
  );

  const dispatch = useDispatch();

  return (
    <Tabs
      defaultActiveKey="overall-view"
      id="admin-file-service-tab"
      className="file-tab"
      activeKey={activeTab}
      onSelect={(key) => dispatch({ type: TYPES.FILE_SET_ACTIVE_TAB, key })}
    >
      <Tab eventKey="overall-view" title="Overview">
        <FileOverview />
      </Tab>

      <Tab eventKey="space" title="Space Config" disabled={!isActive}>
        <FileSpace />
      </Tab>

      <Tab eventKey="templates" title="Templates" disabled={!isActive}>
        <Templates />
      </Tab>

      <Tab eventKey="usage" title="Usage" disabled={!isActive}>
        <Usage />
      </Tab>

      <Tab
        eventKey="api-integration"
        title="API integration"
        disabled={!isActive}
      >
        <APIIntegration />
      </Tab>

      <Tab eventKey="file-setting" title="Settings" disabled={!isActive}>
        <FileSettings />
      </Tab>
    </Tabs>
  );
};

const TabsForInit = () => {
  const activeTab = useSelector(
    (state: RootState) => state.file.states.activeTab
  );

  return (
    <Tabs
      defaultActiveKey="overall-view"
      id="admin-file-service-tab"
      className="file-tab"
      activeKey={activeTab}
    >
      <Tab eventKey="overall-view" title="Overview">
        <InitSetup />
      </Tab>
    </Tabs>
  );
};

export default function File() {
  const setupRequired = useSelector(
    (state: RootState) => state.file.requirements.setup
  );

  const dispatch = useDispatch();
  const tenantAPI = useSelector((state: RootState) => state.config.tenantAPI);
  const user = useSelector((state: RootState) => state.user);
  // TODO: shall we load the file service info at begining?
  dispatch({
    type: TYPES.FETCH_FILE_SPACE,
    payload: {
      tenantAPI: tenantAPI,
      user: user,
    },
  });

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
