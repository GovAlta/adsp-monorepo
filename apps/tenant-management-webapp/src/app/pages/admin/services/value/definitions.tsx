import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { defaultValueDefinition, type ValueDefinition } from '@store/value/models';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { renderNoItem } from '@components/NoItem';
import { Dispatch } from '@jsonforms/react';
import { ValueDefinitionsList } from './definitionsList';
import { AddEditValueDefinition } from './addEditDefinition';
import { deleteValueDefinition, getValueDefinitions, updateValueDefinition } from '@store/value/actions';
import { PageIndicator } from '@components/Indicator';
import { GoAButton } from '@abgov/react-components-new';
import { Buttons } from '../styled-components';
import { DeleteModal } from '@components/DeleteModal';

interface ValueDefinitionsComponentProps {
  activeEdit: boolean;
}

export const ValueDefinitions: FunctionComponent<ValueDefinitionsComponentProps> = ({ activeEdit }) => {
  const [selectedDefinition, setSelectedDefinition] = useState(defaultValueDefinition);
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const definitions = useSelector((state: RootState) =>
    state.valueService.results.map((r) => state.valueService.definitions[r])
  );

  const reset = () => {
    document.body.style.overflow = 'unset';
    setIsEdit(false);
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultValueDefinition);
  };

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getValueDefinitions());
  }, [dispatch]);

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddDefinition(true);
    }
  }, [activeEdit]);

  const tenantDefinitions = definitions.filter((d) => !d.isCore);
  const coreDefinitions = definitions.filter((d) => d.isCore);

  return (
    <div>
      <br />

      <Buttons>
        <GoAButton
          testId="value-add-definition"
          onClick={() => {
            setOpenAddDefinition(true);
          }}
        >
          Add definition
        </GoAButton>
      </Buttons>
      {indicator.show && <PageIndicator />}
      {!indicator.show && !tenantDefinitions && renderNoItem('tenant value')}
      {!indicator.show && tenantDefinitions && (
        <ValueDefinitionsList
          definitions={tenantDefinitions}
          onDelete={(def: ValueDefinition) => {
            setSelectedDefinition(def);
            setIsEdit(false);
            setShowDeleteConfirmation(true);
          }}
        />
      )}
      {!indicator.show && coreDefinitions && (
        <div>
          <h2>Core definitions</h2>
          <ValueDefinitionsList
            definitions={coreDefinitions}
            onDelete={(def: ValueDefinition) => {
              setSelectedDefinition(def);
              setIsEdit(false);
              setShowDeleteConfirmation(true);
            }}
          />
        </div>
      )}
      {openAddDefinition && (
        <AddEditValueDefinition
          open={isEdit || openAddDefinition}
          onClose={reset}
          isEdit={isEdit}
          initialValue={selectedDefinition}
          values={[...tenantDefinitions, ...coreDefinitions]}
          onSave={(definition) => {
            dispatch(updateValueDefinition(definition));
          }}
        />
      )}
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete value definition"
        content={`Delete ${selectedDefinition?.name}?`}
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteValueDefinition(selectedDefinition));
          setSelectedDefinition(defaultValueDefinition);
        }}
      />
    </div>
  );
};
