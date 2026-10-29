import { GoabButton, GoabCallout, GoabDetails } from '@abgov/react-components';
import { useEffect, useState } from 'react';
import { FailedEvent, getFailedEvents, replayFailedEvent } from './auditApi';
import { errorMessage, isForbidden } from './util';
import { ErrorCallout, Json } from './common';

const NOT_PERMITTED =
  'You do not have permission to view or replay failed events. This requires the audit-admin role; ask a tenant administrator to grant it to your account.';

export function AuditFailedEvents() {
  const [events, setEvents] = useState<FailedEvent[]>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [forbidden, setForbidden] = useState(false);

  const fail = (err: unknown) => {
    if (isForbidden(err)) {
      setForbidden(true);
      setEvents(undefined);
    } else {
      setError(errorMessage(err));
    }
  };

  const load = async () => {
    try {
      setError(undefined);
      setForbidden(false);
      setEvents((await getFailedEvents({ top: 25 })).results);
    } catch (err) {
      fail(err);
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
      fail(err);
    }
  };

  return (
    <>
      {message && (
        <GoabCallout type="success" mt="l">
          {message}
        </GoabCallout>
      )}
      {forbidden && (
        <GoabCallout type="important" heading="Permission required" mt="l">
          {NOT_PERMITTED}
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
