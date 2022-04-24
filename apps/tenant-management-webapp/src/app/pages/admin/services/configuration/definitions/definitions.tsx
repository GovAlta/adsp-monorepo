import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getConfigurationDefinitions } from '../../../../../store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { NameDiv } from '../styled-components';
import { renderNoItem } from '@components/NoItem';
import { ServiceTableComponent } from './definitionslist';
import { GoAButton } from '@abgov/react-components';
import { defaultConfigDefinition } from '@store/configuration/model';
import { updateConfigurationDefinition } from '@store/configuration/action';
import { AddEditConfigDefinition } from './addEditDefinition';
import { DeleteModal } from '@components/DeleteModal';

export const ConfigurationDefinitions: FunctionComponent = () => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const coreTenant = 'Platform';
  const [selectedDefinition, setSelectedDefinition] = useState(defaultConfigDefinition);
  const [selectedDefinitionName, setSelectedDefinitionName] = useState('');
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const reset = () => {
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultConfigDefinition);
  };
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);
  return (
    <>
      {tenantName !== coreTenant ? (
        <>
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
            }}
          />
        </>
      ) : (
        ''
      )}

      {indicator.show && <PageIndicator />}
      <div>
        {!indicator.show && !tenantConfigDefinitions && renderNoItem('configuration')}
        {!indicator.show && tenantConfigDefinitions && (
          <>
            <ServiceTableComponent
              onDelete={(selectedDefinitionName) => {
                setSelectedDefinitionName(selectedDefinitionName);
                setShowDeleteConfirmation(true);
              }}
              tenantName={tenantName}
              definitions={tenantConfigDefinitions}
            />
          </>
        )}
      </div>
      <div>
        {!indicator.show && !coreConfigDefinitions && renderNoItem('configuration')}
        {!indicator.show && coreConfigDefinitions && (
          <>
            <ServiceTableComponent tenantName={coreTenant} definitions={coreConfigDefinitions} />
          </>
        )}
      </div>
      {/* Delete confirmation */}
      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete event definition"
          content={`Delete ${selectedDefinitionName}?`}
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            console.log('selectedDefinitionName', selectedDefinitionName);
            // dispatch(deleteEventDefinition(selectedDefinitionName));
          }}
        />
      )}
    </>
  );
};
