import React, { FunctionComponent } from 'react';

export const EventsOverview: FunctionComponent = () => {
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
    </div>
  );
};
