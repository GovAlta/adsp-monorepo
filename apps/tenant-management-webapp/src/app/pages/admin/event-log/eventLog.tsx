import { Main } from '@components/Html';
import { RootState } from '@store/index';
import { getEventLogEntries } from '@store/event/actions';
import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventLogEntries } from './eventLogEntries';
import { GoACallout } from '@abgov/react-components';

export const EventLog: FunctionComponent = () => {
  const readerRole = 'value-reader';
  const hasReaderRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:value-service']?.roles?.includes(readerRole)
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (hasReaderRole) {
      dispatch(getEventLogEntries());
    }
  }, [dispatch, hasReaderRole]);

  return (
    <Main>
      <h2>Event log</h2>
      <p>
        The event log shows the sequence of events for your tenant. Enable the adsp-event-listener in your realm to
        include access events. Send domain events via the event service to include your own events in the log.
      </p>
      <section>
        {hasReaderRole ? (
          <EventLogEntries />
        ) : (
          <GoACallout
            title="Value reader role required"
            type="information"
            content="You need the urn:ads:platform:value-service 'value-reader' role to see the event log."
          />
        )}
      </section>
    </Main>
  );
};
