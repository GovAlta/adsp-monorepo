import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { deleteConfigurationDefinition, getConfigurationDefinitions } from '../../../../../store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { ConfigurationDefinitionsTableComponent } from './definitionsList';
import { GoAButton } from '@abgov/react-components';
import { defaultConfigDefinition } from '@store/configuration/model';
import { updateConfigurationDefinition } from '@store/configuration/action';
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
      {!indicator.show && (
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
        </>
      )}
      {/*Add/Edit definition */}
      {(isEdit || openAddDefinition) && (
        <AddEditConfigDefinition
          open={openAddDefinition}
          onClose={reset}
          isEdit={isEdit}
          initialValue={selectedDefinition}
          onSave={(definition) => {
            dispatch(updateConfigurationDefinition(definition, false));
          }}
        />
      )}
      {indicator.show && <PageIndicator />}
      {/* tenant config definition */}
      <div>
        {!indicator.show && !tenantConfigDefinitions && renderNoItem('configuration')}
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
              definitions={tenantConfigDefinitions}
            />
          </>
        )}
      </div>
      {/* platform config definitions */}
      <div>
        {!indicator.show && !coreConfigDefinitions && renderNoItem('configuration')}
        {!indicator.show && coreConfigDefinitions && (
          <>
            <ConfigurationDefinitionsTableComponent tenantName={coreTenant} definitions={coreConfigDefinitions} />
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
