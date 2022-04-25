import React, { FunctionComponent, useEffect, useState } from 'react';
import { AddEditConfigDefinition } from './definitions/addEditDefinition';
import { GoAButton } from '@abgov/react-components';
import { defaultConfigDefinition } from '@store/configuration/model';
import { useDispatch, useSelector } from 'react-redux';
import { updateConfigurationDefinition } from '@store/configuration/action';
import { RootState } from '@store/index';

interface ConfigurationOverviewProps {
  updateActiveIndex?: (index: number) => void;
}
export const ConfigurationOverview: FunctionComponent<ConfigurationOverviewProps> = ({ updateActiveIndex }) => {
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState(defaultConfigDefinition);
  const isAddedFromOverviewPage = useSelector((state: RootState) => state.configuration?.isAddedFromOverviewPage);

  const dispatch = useDispatch();

  // set index to 0(overview tab) when switching back to it
  useEffect(() => {
    updateActiveIndex(0);
  }, []);

  const reset = () => {
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultConfigDefinition);
  };

  // If a definition is added on overview page, then switch to definition tab
  if (isAddedFromOverviewPage) {
    updateActiveIndex(1);
  }

  return (
    <div>
      <AddEditConfigDefinition
        open={openAddDefinition}
        onClose={reset}
        isEdit={false}
        initialValue={selectedDefinition}
        onSave={(definition) => {
          dispatch(updateConfigurationDefinition(definition, true));
        }}
      />
      <p>
        The configuration service provides a generic json document store for storage and revisioning of infrequently
        changing configuration. Store configuration against namespace and name keys, and optionally define configuration
        schemas for write validation.
      </p>
      <br />
      <GoAButton
        data-testid="add-definition"
        onClick={() => {
          setOpenAddDefinition(true);
        }}
      >
        Add definition
      </GoAButton>
    </div>
  );
};
