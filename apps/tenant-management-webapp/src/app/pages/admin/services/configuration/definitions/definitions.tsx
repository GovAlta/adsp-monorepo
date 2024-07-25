import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { ConfigurationDefinitionsTableComponent } from './definitionsList';
import { GoAButton } from '@abgov/react-components-new';
import { defaultConfigDefinition } from '@store/configuration/model';
import {
  updateConfigurationDefinition,
  deleteConfigurationDefinition,
  getConfigurationDefinitions,
} from '@store/configuration/action';
import { AddEditConfigDefinition } from './addEditDefinition';
import { DeleteModal } from '@components/DeleteModal';
import { NameDiv } from '../styled-components';

interface ParentCompProps {
  activeEdit?: boolean;
}

const transformConfigDefinitions = (configDefinitions: Record<string, unknown>) => {
  const tenantServices: Record<string, unknown> = {};
  const coreServices: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(configDefinitions)) {
    if (key.includes(':')) {
      tenantServices[key] = value;
    } else {
      coreServices[key] = value;
    }
  }

  return {
    tenant: tenantServices,
    core: coreServices,
  };
};

export const ConfigurationDefinitions: FunctionComponent<ParentCompProps> = ({ activeEdit }) => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const transformedCoreConfigDefinitions = transformConfigDefinitions(coreConfigDefinitions?.configuration || {});
  const coreTenant = 'Platform';
  const [selectedDefinition, setSelectedDefinition] = useState(defaultConfigDefinition);
  const [selectedDefinitionName, setSelectedDefinitionName] = useState('');
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const reset = () => {
    setIsEdit(false);
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultConfigDefinition);
  };

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, [dispatch]);

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddDefinition(true);
    }
  }, [activeEdit]);

  return (
    <>
      <br />
      <GoAButton
        testId="add-definition"
        onClick={() => {
          setOpenAddDefinition(true);
        }}
      >
        Add definition
      </GoAButton>

      {/*Add/Edit definition */}

      <AddEditConfigDefinition
        open={isEdit || openAddDefinition}
        onClose={reset}
        isEdit={isEdit}
        initialValue={selectedDefinition}
        configurations={{ ...tenantConfigDefinitions?.configuration, ...coreConfigDefinitions?.configuration }}
        onSave={(definition) => {
          dispatch(updateConfigurationDefinition(definition, false));
        }}
      />

      {indicator.show && <PageIndicator />}
      {/* tenant config definition */}
      <div>
        {!indicator.show && !tenantConfigDefinitions && renderNoItem('tenant configuration')}
        {!indicator.show && tenantConfigDefinitions && (
          <ConfigurationDefinitionsTableComponent
            onDelete={(selectedDefinitionName) => {
              setSelectedDefinitionName(selectedDefinitionName);
              setShowDeleteConfirmation(true);
            }}
            onEdit={(editDefinition) => {
              setSelectedDefinition({ ...editDefinition });
              setIsEdit(true);
              setOpenAddDefinition(true);
            }}
            isTenantSpecificConfig={true}
            tenantName={tenantName}
            definitions={tenantConfigDefinitions.configuration}
          />
        )}
      </div>
      {/* platform config definitions */}
      <div>
        {!indicator.show && !coreConfigDefinitions && renderNoItem('core configuration')}
        {!indicator.show && coreConfigDefinitions && (
          <ConfigurationDefinitionsTableComponent
            tenantName={coreTenant}
            definitions={transformedCoreConfigDefinitions.tenant}
          />
        )}
      </div>
      {/* core config definitions */}
      <div>
        {!indicator.show && !coreConfigDefinitions && renderNoItem('core configuration')}
        {!indicator.show && coreConfigDefinitions && (
          <>
            <NameDiv>Core definitions</NameDiv>
            <ConfigurationDefinitionsTableComponent
              tenantName={tenantName}
              definitions={transformedCoreConfigDefinitions.core}
            />
          </>
        )}
      </div>
      {/* Delete confirmation */}

      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete configuration definition"
        content={`Delete ${selectedDefinitionName}?`}
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteConfigurationDefinition(selectedDefinitionName));
        }}
      />
    </>
  );
};
