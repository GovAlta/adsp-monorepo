import {
  GoabBlock,
  GoabButton,
  GoabCallout,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabTextArea,
} from '@abgov/react-components';
import { useEffect, useState } from 'react';
import { ActionDefinition, AuditEventInput, getActions, SAMPLE_NAMESPACE, WriteResult, writeEvents } from './auditApi';
import { errorMessage } from './util';
import { Card, ErrorCallout, FormGrid } from './common';

function newEvent(): AuditEventInput {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    action: 'sample-action',
    status: 'success',
    actor: { id: 'sample-user', type: 'user', name: 'Sample User' },
    resource: { type: 'sample-resource', id: '1' },
    metadata: { source: 'sandbox-app' },
  };
}

const format = (event: AuditEventInput) => JSON.stringify(event, null, 2);

// The audit service only lets a client write to the namespace named after its own service URN.
const WRITE_NAMESPACE = SAMPLE_NAMESPACE;

// The action must be defined in the namespace's audit action catalog (registered via service configuration).
export function AuditWrite() {
  const namespace = WRITE_NAMESPACE;
  const [body, setBody] = useState(() => format(newEvent()));
  const [result, setResult] = useState<WriteResult>();
  const [error, setError] = useState<string>();
  const [actions, setActions] = useState<ActionDefinition[]>([]);

  useEffect(() => {
    getActions(namespace)
      .then(setActions)
      .catch((err) => setError(errorMessage(err)));
  }, [namespace]);

  const selectedAction = (() => {
    try {
      return JSON.parse(body).action as string;
    } catch {
      return undefined;
    }
  })();

  // Points the event at the chosen catalog action, keeping the rest of the edited JSON where it is valid.
  const selectAction = (name: string) => {
    const action = actions.find((a) => a.name === name);
    let event: AuditEventInput;
    try {
      event = JSON.parse(body);
    } catch {
      event = newEvent();
    }
    event.action = name;
    if (typeof action?.resourceType === 'string') {
      event.resource = { id: '1', ...event.resource, type: action.resourceType };
    }
    setBody(format(event));
  };

  const submit = async () => {
    try {
      setError(undefined);
      setResult(await writeEvents(namespace, [JSON.parse(body)]));
    } catch (err) {
      setResult(undefined);
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <Card title="Write an audit event">
        <FormGrid>
          <GoabFormItem label="Namespace" helpText="Namespace whose action catalog defines the event's action.">
            <GoabInput name="namespace" width="100%" value={namespace} disabled onChange={() => undefined} />
          </GoabFormItem>
          <GoabFormItem label="Action" helpText="Actions from the catalog; updates the event JSON below.">
            <GoabDropdown
              name="action"
              width="100%"
              value={selectedAction}
              onChange={(e) => selectAction(e.value as string)}
            >
              {actions.map(({ name }) => (
                <GoabDropdownItem key={name} value={name} label={name} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
        </FormGrid>
        <GoabFormItem label="Event (JSON)" mt="xl">
          <GoabTextArea name="event" rows={16} width="100%" value={body} onChange={(e) => setBody(e.value)} />
        </GoabFormItem>
        <GoabBlock gap="m" mt="xl">
          <GoabButton type="primary" onClick={submit}>
            Write event
          </GoabButton>
          <GoabButton type="tertiary" onClick={() => setBody(format(newEvent()))}>
            Generate new event
          </GoabButton>
        </GoabBlock>
      </Card>
      <ErrorCallout message={error} />
      {result && (
        <GoabCallout
          type={result.rejected.length ? 'important' : 'success'}
          heading={`Accepted ${result.accepted}, duplicates ${result.duplicates}, rejected ${result.rejected.length}`}
        >
          {result.rejected.map((rejected) => (
            <div key={rejected.index}>
              #{rejected.index} {rejected.code}: {rejected.reason}
            </div>
          ))}
        </GoabCallout>
      )}
    </>
  );
}
