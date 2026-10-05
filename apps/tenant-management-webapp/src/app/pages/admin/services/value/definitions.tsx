import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { defaultValueDefinition, type ValueDefinition } from '@store/value/models';
import { renderNoItem } from '@components/NoItem';

import { ValueDefinitionsList } from './definitionsList';
import { AddEditValueDefinition } from './addEditDefinition';
import {
  createValueDefinition,
  clearValueDefinitionSaveError,
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
  const dispatch = useDispatch();
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const definitionSave = useSelector((state: RootState) => state.valueService.save);
  const completedSave = useRef(definitionSave.completed);
  const definitions = useSelector((state: RootState) =>
    state.valueService.results.map((r) => state.valueService.definitions[r])
  );

  const reset = useCallback(() => {
    document.body.style.overflow = 'unset';
    setIsEdit(false);
    setOpenAddDefinition(false);
    setSelectedDefinition(defaultValueDefinition);
    dispatch(clearValueDefinitionSaveError());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getValueDefinitions());
  }, [dispatch]);
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [definitions]);

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddDefinition(true);
    }
  }, [activeEdit, reset]);
  useEffect(() => {
    if (definitionSave.completed !== completedSave.current) {
      completedSave.current = definitionSave.completed;

      if (openAddDefinition) {
        reset();
      }
    }
  }, [definitionSave.completed, openAddDefinition, reset]);

  const tenantDefinitions = definitions.filter((d) => !d.isCore);
  const coreDefinitions = definitions.filter((d) => d.isCore);

  return (
    <section>
      <Buttons>
        <GoabButton
          size="compact"
          testId="value-add-definition"
          onClick={() => {
            dispatch(clearValueDefinitionSaveError());
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
            dispatch(clearValueDefinitionSaveError());
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
              dispatch(clearValueDefinitionSaveError());
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
          saving={definitionSave.saving}
          saveError={definitionSave.error}
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
