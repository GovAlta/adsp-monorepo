import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';
import { EventDefinitionsList } from './definitionsList';
import { EventDefinitionModalForm } from './edit';
import { deleteEventDefinition } from '@store/event/actions';
import { defaultEventDefinition, EventDefinition } from '@store/event/models';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { PageIndicator } from '@components/Indicator';
import { DeleteModal } from '@components/DeleteModal';

interface ParentCompProps {
  activeEdit?: boolean;
}

export const EventDefinitions: FunctionComponent<ParentCompProps> = ({ activeEdit }) => {
  const [editDefinition, setEditDefinition] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<EventDefinition>(defaultEventDefinition);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const definitions = useSelector((state: RootState) => state.event.definitions);
  const [coreNamespaces, setCoreNamespaces] = useState<string[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    const namespaces = Object.values(definitions)
      .filter((d: EventDefinition) => d.isCore)
      .map((d: EventDefinition) => d.namespace);
    setCoreNamespaces(namespaces);
  }, [definitions]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const dispatch = useDispatch();

  function reset() {
    setEditDefinition(false);
    setSelectedDefinition(defaultEventDefinition);
  }

  return (
    <section>
      <PageIndicator />
      {!indicator.show && definitions && (
        <div>
          <Buttons>
            <GoAButton
              testId="add-definition"
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
        </div>
      )}

      {/* Delete confirmation */}

      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete event definition"
        content={`Delete ${selectedDefinition?.name}?`}
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteEventDefinition(selectedDefinition));
        }}
      />

      <EventDefinitionModalForm
        open={editDefinition}
        initialValue={selectedDefinition}
        isEdit={isEdit}
        definitions={definitions}
        coreNamespaces={coreNamespaces}
        onClose={() => {
          reset();
        }}
      />
    </section>
  );
};

export default EventDefinitions;

const Buttons = styled.div`
  margin-bottom: 1rem;
  text-align: left;
`;
