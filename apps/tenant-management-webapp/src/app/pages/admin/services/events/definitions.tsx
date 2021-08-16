import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { EventDefinitionsList } from './definitionsList';
import { EventDefinitionForm } from './edit';
import Dialog, { DialogActions, DialogContent, DialogTitle } from '@components/Dialog';
import { deleteEventDefinition, getEventDefinitions, updateEventDefinition } from '@store/event/actions';
import { EventDefinition } from '@store/event/models';
import { RootState } from '@store/index';
import styled from 'styled-components';

export const EventDefinitions: FunctionComponent = () => {
  const [editDefinition, setEditDefinition] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<EventDefinition>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const definitions = useSelector((state: RootState) => state.event.definitions);

  const [coreNamespaces, setCoreNamespaces] = useState<string[]>([]);
  useEffect(() => {
    const namespaces = Object.values(definitions)
      .filter((d: EventDefinition) => d.isCore)
      .map((d: EventDefinition) => d.namespace);

    setCoreNamespaces(namespaces);
  }, [definitions]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  function clearForm() {
    setEditDefinition(false);
    setSelectedDefinition(null);
    setErrors({});
  }

  return (
    <>
      <Buttons>
        <GoAButton data-testid="add-definition" buttonSize="small" onClick={() => setEditDefinition(true)}>
          Add definition
        </GoAButton>
      </Buttons>

      <EventDefinitionsList
        onEdit={(def: EventDefinition) => {
          setEditDefinition(true);
          setSelectedDefinition(def);
        }}
        onDelete={(def: EventDefinition) => {
          setShowDeleteConfirmation(true);
          setSelectedDefinition(def);
        }}
      />

      {/* Delete confirmation */}
      <Dialog testId="delete-confirmation" open={showDeleteConfirmation}>
        <DialogTitle>Delete Definition</DialogTitle>
        <DialogContent>Delete {selectedDefinition?.name}?</DialogContent>
        <DialogActions>
          <GoAButton buttonType="tertiary" data-testid="delete-cancel" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="delete-confirm"
            onClick={() => {
              setShowDeleteConfirmation(false);
              dispatch(deleteEventDefinition(selectedDefinition));
            }}
          >
            Confirm
          </GoAButton>
        </DialogActions>
      </Dialog>

      {/* Form */}
      <Dialog testId="definition-form" open={editDefinition}>
        <DialogTitle>{selectedDefinition ? 'Edit Definition' : 'Create Definition'}</DialogTitle>
        <DialogContent>
          <EventDefinitionForm
            initialValue={selectedDefinition}
            errors={errors}
            onSave={(definition) => {
              if (definition.namespace.includes(':')) {
                setErrors({ ...errors, namespace: 'Must not contain `:` character' });
                return;
              }

              if (coreNamespaces.includes(definition.namespace)) {
                setErrors({ ...errors, namespace: 'Cannot add definitions to core namespaces' });
                return;
              }

              dispatch(updateEventDefinition(definition));
              clearForm();
            }}
            onCancel={() => {
              clearForm();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDefinitions;

const Buttons = styled.div`
  margin-bottom: 1rem;
  text-align: right;
`;
