import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { NotificationDefinitionsList } from './definitionsList';
import { NotificationDefinitionModalForm } from './edit';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import {
  deleteNotificationDefinition,
  getNotificationDefinitions,
  updateNotificationDefinition,
} from '@store/event/actions';
import { NotificationDefinition } from '@store/event/models';
import { RootState } from '@store/index';
import styled from 'styled-components';

const emptyNotificationDefinition: NotificationDefinition = {
  isCore: false,
  namespace: '',
  name: '',
  description: '',
  payloadSchema: {},
};

export const NotificationDefinitions: FunctionComponent = () => {
  const [editDefinition, setEditDefinition] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<NotificationDefinition>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const definitions = useSelector((state: RootState) => state.event.definitions);

  const [coreNamespaces, setCoreNamespaces] = useState<string[]>([]);
  useEffect(() => {
    const namespaces = Object.values(definitions)
      .filter((d: NotificationDefinition) => d.isCore)
      .map((d: NotificationDefinition) => d.namespace);

    setCoreNamespaces(namespaces);
  }, [definitions]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getNotificationDefinitions());
  }, [dispatch]);

  function reset() {
    setEditDefinition(false);
    setSelectedDefinition(emptyNotificationDefinition);
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
          Add Definition
        </GoAButton>
      </Buttons>

      <NotificationDefinitionsList
        onEdit={(def: NotificationDefinition) => {
          setSelectedDefinition(def);
          setEditDefinition(true);
        }}
        onDelete={(def: NotificationDefinition) => {
          setSelectedDefinition(def);
          setShowDeleteConfirmation(true);
        }}
      />

      {/* Delete confirmation */}
      <GoAModal testId="delete-confirmation" isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Delete Definition</GoAModalTitle>
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
              dispatch(deleteNotificationDefinition(selectedDefinition));
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>

      {/* Form */}
      <NotificationDefinitionModalForm
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

          dispatch(updateNotificationDefinition(definition));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
    </>
  );
};

export default NotificationDefinitions;

const Buttons = styled.div`
  margin-bottom: 1rem;
  text-align: right;
`;
