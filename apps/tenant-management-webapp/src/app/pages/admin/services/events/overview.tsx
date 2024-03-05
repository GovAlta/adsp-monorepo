import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components-new';

import { getEventDefinitions } from '@store/event/actions';
import { useDispatch } from 'react-redux';

import { EventMetrics } from './metrics';
import { fetchEventMetrics } from '@store/event/actions';

interface OverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const EventsOverview: FunctionComponent<OverviewProps> = (props) => {
  const { setActiveEdit, setActiveIndex } = props;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchEventMetrics());
  }, [dispatch]);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // set index to 0(overview tab) when switching back to it
  useEffect(() => {
    setActiveIndex(0);
  }, [setActiveIndex]);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

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
          testId="add-definition"
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add definition
        </GoAButton>
      </section>
      <EventMetrics />
    </div>
  );
};
