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
import { useNavigate } from 'react-router-dom';
import { NameDiv } from '../../styled-components';

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
  const tenantKeys = Object.keys(tenantServices);
  const coreKeys = Object.keys(coreServices);
  if (tenantKeys[0] && coreKeys[0] && tenantKeys[0].localeCompare(coreKeys[0])) {
    return { core: coreServices, tenant: tenantServices };
  } else {
    return { tenant: tenantServices, core: coreServices };
  }
};

export const ConfigurationDefinitions: FunctionComponent<ParentCompProps> = ({ activeEdit }) => {
  const navigate = useNavigate();
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

  const openConfigurationEditor = useSelector((state: RootState) => state.configuration.openEditor);

  useEffect(() => {
    if (openConfigurationEditor) {
      navigate(`edit/${openConfigurationEditor}`);
    }
  }, [openConfigurationEditor]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setIsEdit(false);
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultConfigDefinition);
  };

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getConfigurationDefinitions());
    document.body.style.borderRight = '';
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
          dispatch(updateConfigurationDefinition(definition, false, true));
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
              navigate(`edit/${editDefinition.namespace}:${editDefinition.name}`);
            }}
            isTenantSpecificConfig={true}
            tenantName={tenantName}
            definitions={tenantConfigDefinitions.configuration}
          />
        )}
      </div>
      {/* core config definitions */}
      <div>
        {!indicator.show && !coreConfigDefinitions && renderNoItem('core configuration')}
        {!indicator.show && coreConfigDefinitions && (
          <>
            <NameDiv>Core definitions</NameDiv>
            {Object.keys(transformedCoreConfigDefinitions).map((definition) => {
              return (
                <ConfigurationDefinitionsTableComponent
                  key={definition}
                  tenantName={definition}
                  definitions={transformedCoreConfigDefinitions[definition]}
                />
              );
            })}
            ,
          </>
        )}
      </div>

      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete configuration definition"
        content={
          <div>
            Are you sure you wish to delete <b> {selectedDefinitionName}</b>?
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteConfigurationDefinition(selectedDefinitionName));
        }}
      />
    </>
  );
};
