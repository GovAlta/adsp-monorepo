import React, { FunctionComponent, useState } from 'react';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components';
import { ScriptItem, ScriptItemTriggerEvent, defaultTriggerEvent } from '@store/script/models';
import { TriggerEventModal } from './triggerEventModal';
import DataTable from '@components/DataTable';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { renderNoItem } from '@components/NoItem';
import {
  AddTriggerButtonPadding,
  ScriptEventTriggerListDefinition,
  TriggerEventScrollPane,
} from '../styled-components';
import { DeleteModal } from '@components/DeleteModal';

interface ScriptEditorEventsProps {
  script: ScriptItem;
  eventNames: string[];
  onEditorSave(script: ScriptItem);
}

interface ScriptTriggerEventProps {
  triggerEvent: ScriptItemTriggerEvent;
  readonly?: boolean;
  onEdit: (definition: ScriptItemTriggerEvent) => void;
  onDelete: (definition: ScriptItemTriggerEvent) => void;
}

const ScriptEventTriggerDefinitionComponent: FunctionComponent<ScriptTriggerEventProps> = ({
  triggerEvent,
  onEdit,
  onDelete,
}: ScriptTriggerEventProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td headers="name" data-testid={`script-editor-trigger-event-name-${triggerEvent.name}`}>
          {triggerEvent.namespace}:{triggerEvent?.name}
        </td>

        <td headers="actions" data-testid="actions">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => setShowDetails(!showDetails)}
              testId="script-editor-trigger-events-toggle-details-visibility"
            />

            <GoAContextMenuIcon
              type="create"
              title="Edit"
              onClick={() => onEdit(triggerEvent)}
              testId="script-editor-trigger-events-edit-details"
            />
            <GoAContextMenuIcon
              type="trash"
              title="Delete"
              onClick={() => onDelete(triggerEvent)}
              testId="script-editor-trigger-events-delete-details"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" headers="" colSpan={5}>
            <div className="spacingLarge">Trigger Criteria</div>
            <div data-testid="trigger-events-details">
              {triggerEvent.criteria?.context ? JSON.stringify(triggerEvent.criteria?.context, null, 2) : null}
            </div>
            <br />
          </td>
        </tr>
      )}
    </>
  );
};

interface ScriptEventTriggerListComponentProps {
  className?: string;
  triggerEvents: ScriptItemTriggerEvent[];
  onEdit?: (triggerEvent: ScriptItemTriggerEvent) => void;
  onDelete?: (triggerEvent: ScriptItemTriggerEvent) => void;
}

const ScriptEventTriggerListComponent: FunctionComponent<ScriptEventTriggerListComponentProps> = ({
  className,
  triggerEvents,
  onEdit,
  onDelete,
}) => {
  const sortedTriggerEvents = () => {
    return triggerEvents?.sort((a: ScriptItemTriggerEvent, b: ScriptItemTriggerEvent) => {
      const concatenatedA = `${a.namespace}:${a.name}`;
      const concatenatedB = `${b.namespace}:${b.name}`;
      return concatenatedA.localeCompare(concatenatedB);
    });
  };

  return (
    <TriggerEventScrollPane>
      <ScriptEventTriggerListDefinition>
        <div className={className}>
          {!triggerEvents && renderNoItem('script event trigger')}

          <div>
            <DataTable data-testid="script-editor-trigger-events-table">
              <thead data-testid="script-editor-trigger-events-table-header">
                <tr>
                  <th id="name" data-testid="script-editor-trigger-events-table-header-name">
                    Trigger Name
                  </th>
                  <th id="actions" data-testid="event-trigger-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTriggerEvents().map((triggerEvent) => (
                  <ScriptEventTriggerDefinitionComponent
                    onEdit={onEdit}
                    onDelete={onDelete}
                    key={`${triggerEvent.namespace}:${triggerEvent.name}`}
                    triggerEvent={triggerEvent}
                  />
                ))}
              </tbody>
            </DataTable>
          </div>
        </div>
      </ScriptEventTriggerListDefinition>
    </TriggerEventScrollPane>
  );
};

export const ScriptEditorEventsTab = ({ script, eventNames, onEditorSave }: ScriptEditorEventsProps): JSX.Element => {
  const [openAddTriggerEvent, setOpenAddTriggerEvent] = useState(false);
  const [isNewScriptTriggerEvent, setIsNewScriptTriggerEvent] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedTriggerEvent, setSelectedTriggerEvent] = useState<ScriptItemTriggerEvent>(defaultTriggerEvent);

  const onDelete = (triggerEvent: ScriptItemTriggerEvent) => {
    script.triggerEvents = script.triggerEvents?.filter((trigger) => {
      return trigger.name !== triggerEvent.name;
    });
    onEditorSave(script);
  };

  const onEdit = (triggerEvent: ScriptItemTriggerEvent) => {
    console.log(triggerEvent);
    setOpenAddTriggerEvent(true);
    setIsNewScriptTriggerEvent(false);
    setSelectedTriggerEvent(triggerEvent);
  };

  const onEventTriggerCancel = (triggerEvent) => {
    setOpenAddTriggerEvent(false);

    // Reset the selected trigger event before any changes were made in the modal
    const foundTriggerEvent = script.triggerEvents?.find((tr) => tr.name === selectedTriggerEvent.name);
    if (foundTriggerEvent) {
      setSelectedTriggerEvent(triggerEvent);
    }
  };

  const deleteContentElement = () => {
    return (
      <div>
        Are you sure you wish to delete <b>{selectedTriggerEvent.name}</b>?
      </div>
    );
  };

  return (
    <>
      <AddTriggerButtonPadding>
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            size="compact"
            testId="script-add-trigger-event-button"
            onClick={() => {
              setSelectedTriggerEvent(defaultTriggerEvent);
              setOpenAddTriggerEvent(true);
              setIsNewScriptTriggerEvent(true);
            }}
          >
            Add trigger
          </GoAButton>
        </GoAButtonGroup>
      </AddTriggerButtonPadding>
      <ScriptEventTriggerListComponent
        onEdit={onEdit}
        onDelete={(triggerEvent: ScriptItemTriggerEvent) => {
          setSelectedTriggerEvent(triggerEvent);
          setShowDeleteConfirmation(true);
        }}
        triggerEvents={script?.triggerEvents || []}
      />

      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete Trigger event"
        content={deleteContentElement()}
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          onDelete(selectedTriggerEvent);
        }}
      />

      <TriggerEventModal
        eventNames={eventNames}
        initialValue={isNewScriptTriggerEvent ? defaultTriggerEvent : selectedTriggerEvent}
        open={openAddTriggerEvent}
        isNew={isNewScriptTriggerEvent}
        initialScript={script}
        onCancel={(triggerEvent) => {
          onEventTriggerCancel(triggerEvent);
        }}
        onSave={(triggerEvent: ScriptItemTriggerEvent) => {
          setOpenAddTriggerEvent(false);
          if (script.triggerEvents === undefined) {
            script.triggerEvents = [];
          }

          if (isNewScriptTriggerEvent) {
            script.triggerEvents?.push(triggerEvent);
          } else {
            //Remove and then add the new trigger event.
            script.triggerEvents = script.triggerEvents?.filter((tr) => {
              return tr.name !== selectedTriggerEvent.name;
            });
            script.triggerEvents?.push(triggerEvent);
          }

          onEditorSave(script);
        }}
      />
    </>
  );
};
