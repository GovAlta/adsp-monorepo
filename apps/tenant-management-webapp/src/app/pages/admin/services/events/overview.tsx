import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { RootState } from '@store/index';
import { EventDefinition, defaultEventDefinition } from '@store/event/models';
import { getEventDefinitions } from '@store/event/actions';
import { useDispatch, useSelector } from 'react-redux';
import { EventDefinitionModalForm } from './edit';
import { EventMetrics } from './metrics';
import { fetchEventMetrics } from '@store/event/actions';

interface OverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const EventsOverview: FunctionComponent<OverviewProps> = (props) => {
  const definitions = useSelector((state: RootState) => state.event.definitions);
  const [coreNamespaces, setCoreNamespaces] = useState<string[]>([]);
  const [openAddDefinition, setOpenAddDefinition] = useState(false);
  const { setActiveEdit, setActiveIndex } = props;

  useEffect(() => {
    const namespaces = Object.values(definitions)
      .filter((d: EventDefinition) => d.isCore)
      .map((d: EventDefinition) => d.namespace);
    setCoreNamespaces(namespaces);
  }, [definitions]);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchEventMetrics());
  }, []);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);

  // set index to 0(overview tab) when switching back to it
  useEffect(() => {
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, []);

  function reset() {
    setOpenAddDefinition(false);
  }

  return (
    <div>
      <section>
        <p>
          The event service provides tenant applications with the ability to send domain events. Applications are able
          to leverage additional capabilities as side effects through these events. For example, the event log provides
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
      </section>
      <EventMetrics />

      {openAddDefinition && (
        <EventDefinitionModalForm
          open={true}
          coreNamespaces={coreNamespaces}
          onClose={reset}
          isEdit={false}
          initialValue={defaultEventDefinition}
          onSave={() => {
            setActiveIndex(1);
            setOpenAddDefinition(false);
          }}
        />
      )}
    </div>
  );
};
