import React, { FunctionComponent, useEffect, useState } from 'react';
import { AddEditConfigDefinition } from './definitions/addEditDefinition';
import { GoAButton } from '@abgov/react-components';
import { defaultConfigDefinition } from '@store/configuration/model';
import { useDispatch } from 'react-redux';
import { updateConfigurationDefinition } from '@store/configuration/action';

export const ConfigurationOverview: FunctionComponent<any> = ({ updateActiveIndex }) => {
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState(defaultConfigDefinition);
  const dispatch = useDispatch();

  useEffect(() => {
    updateActiveIndex(0);
  }, []);
  const reset = () => {
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultConfigDefinition);
  };
  return (
    <div>
      <GoAButton
        data-testid="add-definition"
        onClick={() => {
          setOpenAddDefinition(true);
        }}
      >
        Add definition
      </GoAButton>
      <AddEditConfigDefinition
        open={openAddDefinition}
        onClose={reset}
        isEdit={false}
        initialValue={selectedDefinition}
        onSave={(definition) => {
          dispatch(updateConfigurationDefinition(definition));
          updateActiveIndex(1);
        }}
      />
      <p>
        The configuration service provides a generic json document store for storage and revisioning of infrequently
        changing configuration. Store configuration against namespace and name keys, and optionally define configuration
        schemas for write validation.
      </p>
    </div>
  );
};
