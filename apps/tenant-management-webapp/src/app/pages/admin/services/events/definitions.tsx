import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { EventDefinitionsList } from './definitionsList';
import { EventDefinitionEdit } from './edit';
import Dialog, { DialogContent, DialogTitle } from '@components/Dialog';
import { getEventDefinitions, updateEventDefinition } from '@store/event/actions';

export const EventDefinitions: FunctionComponent = () => {
  const [addDefinition, setAddDefinition] = useState(false);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getEventDefinitions());
  });

  return (
    <div>
      <div>
        <GoAButton onClick={() => setAddDefinition(true)}>Add definition</GoAButton>
      </div>
      <EventDefinitionsList />
      <Dialog open={addDefinition}>
        <DialogTitle>Edit Definition</DialogTitle>
        <DialogContent>
          <EventDefinitionEdit
            onSave={(definition) => {
              setAddDefinition(false);
              dispatch(updateEventDefinition(definition));
            }}
            onCancel={() => setAddDefinition(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
