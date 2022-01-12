import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { RootState } from '@store/index';
import { EventDefinition, defaultEventDefinition } from '@store/event/models';
import { useSelector } from 'react-redux';
import { EventDefinitionModalForm } from './edit';

interface OverviewProps {
  updateActiveIndex: (index: number) => void;
}

export const EventsOverview: FunctionComponent<OverviewProps> = ({ updateActiveIndex }) => {
  const definitions = useSelector((state: RootState) => state.event.definitions);
  const [coreNamespaces, setCoreNamespaces] = useState<string[]>([]);
  const [openAddDefinition, setOpenAddDefinition] = useState(false);

  useEffect(() => {
    const namespaces = Object.values(definitions)
      .filter((d: EventDefinition) => d.isCore)
      .map((d: EventDefinition) => d.namespace);
    setCoreNamespaces(namespaces);
  }, [definitions]);

  function reset() {
    setOpenAddDefinition(false);
  }

  return (
    <div>
      <p>
        The event service provides tenant applications with the ability to send domain events. Applications are able to
        leverage additional capabilities as side effects through these events. For example, the event log provides
        traceability by recording the sequence of domain events for tenants aside from application components.
      </p>
      <h2>Event definitions</h2>
      <p>
        Event definitions are optional metadata descriptions of domain events. If a definition is configured for a
        domain event, the event service will perform schema validation when that event is sent. The definition can be
        utilized by services consuming events. For example, notification template configuration can validate template
        variables as matching the payload from a triggering event.
      </p>
      <GoAButton
        data-testid="add-definition"
        onClick={() => {
          setOpenAddDefinition(true);
        }}
      >
        Add definition
      </GoAButton>

      {openAddDefinition && (
        <EventDefinitionModalForm
          open={true}
          coreNamespaces={coreNamespaces}
          onClose={reset}
          isEdit={false}
          initialValue={defaultEventDefinition}
          onSave={() => {
            updateActiveIndex(1);
          }}
        />
      )}
      <br />
      <br />
    </div>
  );
};
