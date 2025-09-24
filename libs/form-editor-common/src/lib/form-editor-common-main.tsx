import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import FormOverview from './formOverview';

import { FormDefinitions } from './definitions/definitions';
import { Tab, Tabs } from './components/Tabs';
import { fetchDirectory } from '../lib/store/directory/actions';
import { useLocation } from 'react-router-dom';
import { FormExport } from './export/formExport';

export function FormEditorCommonMain({config}) {
    const dispatch = useDispatch();
  const tabs = config.tabs;
  const availableTabs = Object.keys(tabs).filter((tabKey) =>
    typeof tabs[tabKey] === 'boolean' ? tabs[tabKey] : tabs[tabKey].enabled
  );

   const configDirectory = useSelector((state: RootState) => state.config);
  
  if (availableTabs.length === 0) {
    throw new Error('At least one tab must be enabled');
  }
  const [openAddDefinition, setOpenAddDefinition] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const location = useLocation();
  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;

  useEffect(() => {
    dispatch(fetchDirectory());
  }, [dispatch, configDirectory]);

  useEffect(() => {
    if (isNavigatedFromEdit) {
      setActiveIndex(1);
      setActivateEditState(true);
    }
  }, [isNavigatedFromEdit]);
  return (
    <div>
      <Tabs activeIndex={activeIndex} data-testid="form-tabs">
        {availableTabs.includes('overview') && (
          <Tab label="Overview" data-testid="form-overview-tab">
            <FormOverview
              openAddDefinition={openAddDefinition}
              activateEdit={activateEditState}
              setOpenAddDefinition={setOpenAddDefinition}
              setActiveIndex={setActiveIndex}
            />
          </Tab>
        )}
        {availableTabs.includes('definition') && (
          <Tab label="Definitions" data-testid="form-templates">
            <FormDefinitions
              setOpenAddDefinition={setOpenAddDefinition}
              showFormDefinitions={true}
              openAddDefinition={openAddDefinition}
              features={tabs.definition.features}
            />
          </Tab>
        )}
        {availableTabs.includes('export') && (
          <Tab label="Export" data-testid="form-export">
            <FormExport />
          </Tab>
        )}
      </Tabs>
    </div>
  );
}
