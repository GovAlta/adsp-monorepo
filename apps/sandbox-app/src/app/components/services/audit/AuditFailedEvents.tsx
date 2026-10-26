import { GoabButton, GoabCallout, GoabDetails } from '@abgov/react-components';
import { useEffect, useState } from 'react';
import { FailedEvent, getFailedEvents, replayFailedEvent } from './auditApi';
import { errorMessage } from './util';
import { ErrorCallout, Json } from './common';

export function AuditFailedEvents() {
  const [events, setEvents] = useState<FailedEvent[]>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const load = async () => {
    try {
      setError(undefined);
      setEvents((await getFailedEvents({ top: 25 })).results);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const replay = async (id: string) => {
    try {
      await replayFailedEvent(id);
      setMessage(`Replayed ${id}`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      {message && (
        <GoabCallout type="success" mt="l">
          {message}
        </GoabCallout>
      )}
      <ErrorCallout message={error} />
      {events && !events.length && (
        <GoabCallout type="information" mt="l">
          No failed events.
        </GoabCallout>
      )}
      {events?.map((event) => (
        <GoabDetails key={event.id} heading={event.id} mt="m">
          <Json value={event} />
          <GoabButton type="secondary" mt="m" onClick={() => replay(event.id)}>
            Replay
          </GoabButton>
        </GoabDetails>
      ))}
    </>
  );
}
