import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { defaultValueDefinition, type ValueDefinition } from '@store/value/models';
import { renderNoItem } from '@components/NoItem';

import { ValueDefinitionsList } from './definitionsList';
import { AddEditValueDefinition } from './addEditDefinition';
import {
  clearValueDefinitionSave,
  createValueDefinition,
  deleteValueDefinition,
  getValueDefinitions,
  updateValueDefinition,
} from '@store/value/actions';
import { PageIndicator } from '@components/Indicator';
import { GoabButton } from '@abgov/react-components';
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

  const definitionSave = useSelector((state: RootState) => state.valueService.definitionSave);

  const dispatch = useDispatch();
  const reset = () => {
    document.body.style.overflow = 'unset';
    setIsEdit(false);
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultValueDefinition);
    dispatch(clearValueDefinitionSave());
  };

  useEffect(() => {
    dispatch(getValueDefinitions());
  }, [dispatch]);
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [definitions]);

  // The modal stays open until the service accepts the definition, so a rejected save keeps the user's edits.
  useEffect(() => {
    if (definitionSave?.status === 'saved') {
      reset();
    }
  }, [definitionSave?.status]);

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddDefinition(true);
    }
  }, [activeEdit]);

  const tenantDefinitions = definitions.filter((d) => !d.isCore);
  const coreDefinitions = definitions.filter((d) => d.isCore);

  return (
    <section>
      <Buttons>
        <GoabButton
          size="compact"
          testId="value-add-definition"
          onClick={() => {
            setOpenAddDefinition(true);
          }}
        >
          Add definition
        </GoabButton>
      </Buttons>
      {indicator.show && <PageIndicator />}
      {!indicator.show && tenantDefinitions.length === 0 && renderNoItem('tenant value')}
      {!indicator.show && tenantDefinitions && (
        <ValueDefinitionsList
          definitions={tenantDefinitions}
          onEdit={(def: ValueDefinition) => {
            setSelectedDefinition(def);
            setIsEdit(true);
            setOpenAddDefinition(true);
          }}
          onDelete={(def: ValueDefinition) => {
            setSelectedDefinition(def);
            setIsEdit(false);
            setShowDeleteConfirmation(true);
          }}
        />
      )}
      {!indicator.show && coreDefinitions.length === 0 && renderNoItem('core value')}
      {!indicator.show && coreDefinitions.length > 0 && (
        <div>
          <h2>Core definitions</h2>
          <ValueDefinitionsList
            definitions={coreDefinitions}
            onEdit={(def: ValueDefinition) => {
              setSelectedDefinition(def);
              setIsEdit(true);
              setOpenAddDefinition(true);
            }}
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
          saving={definitionSave?.status === 'saving'}
          saveError={definitionSave?.status === 'failed' ? definitionSave.error : undefined}
          onSave={(definition) => {
            dispatch(isEdit ? updateValueDefinition(definition) : createValueDefinition(definition));
          }}
        />
      )}
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete value definition"
        content={
          <div>
            Are you sure you wish to delete <b>{selectedDefinition?.name}</b>?
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteValueDefinition(selectedDefinition));
          setSelectedDefinition(defaultValueDefinition);
        }}
      />
    </section>
  );
};
