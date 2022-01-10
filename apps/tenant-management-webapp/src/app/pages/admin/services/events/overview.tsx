import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { RootState } from '@store/index';
import { EventDefinition } from '@store/event/models';
import { useSelector } from 'react-redux';
import { EventDefinitionModalForm } from './edit';

interface OverviewProps {
  toEventListTab: () => void;
}

export const EventsOverview: FunctionComponent<OverviewProps> = ({ toEventListTab }) => {
  const definitions = useSelector((state: RootState) => state.event.definitions);
  const [coreNamespaces, setCoreNamespaces] = useState<string[]>([]);
  const [editDefinition, setEditDefinition] = useState(false);

  useEffect(() => {
    const namespaces = Object.values(definitions)
      .filter((d: EventDefinition) => d.isCore)
      .map((d: EventDefinition) => d.namespace);

    setCoreNamespaces(namespaces);
  }, [definitions]);

  function reset() {
    setEditDefinition(false);
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
        buttonSize="small"
        onClick={() => {
          setEditDefinition(true);
        }}
      >
        Add definition
      </GoAButton>

      <EventDefinitionModalForm
        open={editDefinition}
        coreNamespaces={coreNamespaces}
        onClose={reset}
        onSave={toEventListTab}
      />
      <br />
      <br />
    </div>
  );
};
