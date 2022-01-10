import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { EventDefinitionsList } from './definitionsList';
import { EventDefinitionModalForm } from './edit';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { deleteEventDefinition, getEventDefinitions } from '@store/event/actions';
import { defaultEventDefinition, EventDefinition } from '@store/event/models';
import { RootState } from '@store/index';
import styled from 'styled-components';

export const EventDefinitions: FunctionComponent = () => {
  const [editDefinition, setEditDefinition] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<EventDefinition>(defaultEventDefinition);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const definitions = useSelector((state: RootState) => state.event.definitions);
  const [coreNamespaces, setCoreNamespaces] = useState<string[]>([]);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const namespaces = Object.values(definitions)
      .filter((d: EventDefinition) => d.isCore)
      .map((d: EventDefinition) => d.namespace);
    setCoreNamespaces(namespaces);
  }, [definitions]);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  function reset() {
    setEditDefinition(false);
    setSelectedDefinition(defaultEventDefinition);
  }

  return (
    <>
      <Buttons>
        <GoAButton
          data-testid="add-definition"
          buttonSize="small"
          onClick={() => {
            setSelectedDefinition(defaultEventDefinition);
            setIsEdit(false);
            setEditDefinition(true);
          }}
        >
          Add definition
        </GoAButton>
      </Buttons>

      <EventDefinitionsList
        onEdit={(def: EventDefinition) => {
          setSelectedDefinition(def);
          setIsEdit(true);
          setEditDefinition(true);
        }}
        onDelete={(def: EventDefinition) => {
          setSelectedDefinition(def);
          setIsEdit(false);
          setShowDeleteConfirmation(true);
        }}
      />

      {/* Delete confirmation */}
      {showDeleteConfirmation && (
        <GoAModal testId="delete-confirmation" isOpen={true}>
          <GoAModalTitle>Delete definition</GoAModalTitle>
          <GoAModalContent>Delete {selectedDefinition?.name}?</GoAModalContent>
          <GoAModalActions>
            <GoAButton
              buttonType="tertiary"
              data-testid="delete-cancel"
              onClick={() => setShowDeleteConfirmation(false)}
            >
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
      )}

      {editDefinition && (
        <EventDefinitionModalForm
          open={true}
          initialValue={selectedDefinition}
          isEdit={isEdit}
          coreNamespaces={coreNamespaces}
          onClose={() => {
            reset();
          }}
        />
      )}
    </>
  );
};

export default EventDefinitions;

const Buttons = styled.div`
  margin-bottom: 1rem;
  text-align: right;
`;
