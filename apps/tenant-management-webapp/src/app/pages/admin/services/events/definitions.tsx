import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { EventDefinitionsList } from './definitionsList';
import { EventDefinitionModalForm } from './edit';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { deleteEventDefinition, getEventDefinitions, updateEventDefinition } from '@store/event/actions';
import { EventDefinition } from '@store/event/models';
import { RootState } from '@store/index';
import styled from 'styled-components';

const emptyEventDefinition: EventDefinition = {
  isCore: false,
  namespace: '',
  name: '',
  description: '',
  payloadSchema: {},
};

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

  function reset() {
    setEditDefinition(false);
    setSelectedDefinition(emptyEventDefinition);
    setErrors({});
  }

  return (
    <>
      <Buttons>
        <GoAButton
          data-testid="add-definition"
          buttonSize="small"
          onClick={() => {
            setSelectedDefinition(null);
            setEditDefinition(true);
          }}
        >
          Add definition
        </GoAButton>
      </Buttons>

      <EventDefinitionsList
        onEdit={(def: EventDefinition) => {
          setSelectedDefinition(def);
          setEditDefinition(true);
        }}
        onDelete={(def: EventDefinition) => {
          setSelectedDefinition(def);
          setShowDeleteConfirmation(true);
        }}
      />

      {/* Delete confirmation */}
      <GoAModal testId="delete-confirmation" isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Delete definition</GoAModalTitle>
        <GoAModalContent>Delete {selectedDefinition?.name}?</GoAModalContent>
        <GoAModalActions>
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
        </GoAModalActions>
      </GoAModal>

      {/* Form */}
      <EventDefinitionModalForm
        open={editDefinition}
        initialValue={selectedDefinition}
        errors={errors}
        onSave={(definition) => {
          if (definition.namespace.includes(':')) {
            setErrors({ ...errors, namespace: 'Must not contain `:` character' });
            return;
          }
          if (definition.name.includes(':')) {
            setErrors({ ...errors, name: 'Must not contain `:` character' });
            return;
          }

          if (coreNamespaces.includes(definition.namespace.toLowerCase())) {
            setErrors({ ...errors, namespace: 'Cannot add definitions to core namespaces' });
            return;
          }

          dispatch(updateEventDefinition(definition));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
    </>
  );
};

export default EventDefinitions;

const Buttons = styled.div`
  margin-bottom: 1rem;
  text-align: right;
`;
