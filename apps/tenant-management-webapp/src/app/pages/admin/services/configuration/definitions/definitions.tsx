import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { ConfigurationDefinitionsTableComponent } from './definitionsList';
import { GoAButton } from '@abgov/react-components';
import { defaultConfigDefinition } from '@store/configuration/model';
import {
  updateConfigurationDefinition,
  deleteConfigurationDefinition,
  getConfigurationDefinitions,
} from '@store/configuration/action';
import { AddEditConfigDefinition } from './addEditDefinition';
import { DeleteModal } from '@components/DeleteModal';

interface ParentCompProps {
  activeEdit?: boolean;
}

export const ConfigurationDefinitions: FunctionComponent<ParentCompProps> = ({ activeEdit }) => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
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
  }, []);

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
        data-testid="add-definition"
        onClick={() => {
          setOpenAddDefinition(true);
        }}
      >
        Add definition
      </GoAButton>

      {/*Add/Edit definition */}
      {(isEdit || openAddDefinition) && (
        <AddEditConfigDefinition
          open={openAddDefinition}
          onClose={reset}
          isEdit={isEdit}
          initialValue={selectedDefinition}
          configurations={tenantConfigDefinitions}
          onSave={(definition) => {
            dispatch(updateConfigurationDefinition(definition, false));
          }}
        />
      )}
      {indicator.show && <PageIndicator />}
      {/* tenant config definition */}
      <div>
        {!indicator.show && !tenantConfigDefinitions && renderNoItem('tenant configuration')}
        {!indicator.show && tenantConfigDefinitions && (
          <>
            <ConfigurationDefinitionsTableComponent
              onDelete={(selectedDefinitionName) => {
                setSelectedDefinitionName(selectedDefinitionName);
                setShowDeleteConfirmation(true);
              }}
              onEdit={(editDefinition) => {
                setSelectedDefinition(editDefinition);
                setIsEdit(true);
                setOpenAddDefinition(true);
              }}
              isTenantSpecificConfig={true}
              tenantName={tenantName}
              definitions={tenantConfigDefinitions.configuration}
            />
          </>
        )}
      </div>
      {/* platform config definitions */}
      <div>
        {!indicator.show && !coreConfigDefinitions && renderNoItem('core configuration')}
        {!indicator.show && coreConfigDefinitions && (
          <>
            <ConfigurationDefinitionsTableComponent
              tenantName={coreTenant}
              definitions={coreConfigDefinitions.configuration}
            />
          </>
        )}
      </div>
      {/* Delete confirmation */}
      {showDeleteConfirmation && (
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
      )}
    </>
  );
};
