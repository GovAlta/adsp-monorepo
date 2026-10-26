import {
  GoabBlock,
  GoabButton,
  GoabCallout,
  GoabDetails,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
} from '@abgov/react-components';
import { useState } from 'react';
import { ActionDefinition, addAction, getActions, SAMPLE_NAMESPACE } from './auditApi';
import { errorMessage } from './util';
import { Card, ErrorCallout, FormGrid, Json } from './common';

const CATEGORIES = ['administrative', 'runtime', 'security', 'data-access'];
const SEVERITIES = ['info', 'warning', 'critical'];
const RETENTION_CLASSES = ['standard', 'security', 'compliance'];
const ACTION_NAME = /^[a-zA-Z0-9]+(?:[._:-][a-zA-Z0-9]+)*$/;

export function AuditActions() {
  const namespace = SAMPLE_NAMESPACE;
  const [actions, setActions] = useState<ActionDefinition[]>();
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({
    name: '',
    category: 'runtime',
    severity: 'info',
    retentionClass: 'standard',
    resourceType: '',
    description: '',
  });
  const [added, setAdded] = useState<string>();
  const [submitted, setSubmitted] = useState(false);

  const nameError = !form.name
    ? 'Action name is required.'
    : !ACTION_NAME.test(form.name)
      ? 'Use letters and digits, optionally separated by . _ : or - (e.g. sample-action).'
      : undefined;

  const load = async (ns = namespace) => {
    try {
      setError(undefined);
      setActions(await getActions(ns));
    } catch (err) {
      setActions(undefined);
      setError(errorMessage(err));
    }
  };

  const add = async () => {
    setSubmitted(true);
    if (nameError) {
      return;
    }
    try {
      setError(undefined);
      setAdded(undefined);
      const { name, resourceType, description, ...rest } = form;
      await addAction(name, {
        version: 1,
        ...rest,
        ...(resourceType ? { resourceType } : {}),
        ...(description ? { description } : {}),
      });
      setAdded(`Added ${name}. The audit service may take a moment to pick up the change; reload to check.`);
      setForm({ ...form, name: '' });
      setSubmitted(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const select = (key: 'category' | 'severity' | 'retentionClass', values: string[], label: string) => (
    <GoabFormItem label={label}>
      <GoabDropdown name={key} value={form[key]} width="100%" onChange={(e) => setForm({ ...form, [key]: e.value as string })}>
        {values.map((value) => (
          <GoabDropdownItem key={value} value={value} label={value} />
        ))}
      </GoabDropdown>
    </GoabFormItem>
  );

  return (
    <>
      <Card title="Action catalog">
        <FormGrid>
          <GoabFormItem label="Namespace">
            <GoabInput name="namespace" value={namespace} width="100%" disabled onChange={() => undefined} />
          </GoabFormItem>
          <GoabFormItem label="&nbsp;">
            <GoabButton type="primary" onClick={() => load()}>
              Load actions
            </GoabButton>
          </GoabFormItem>
        </FormGrid>
        {actions && !actions.length && (
          <GoabCallout type="information" mt="l">
            No actions are defined for this namespace.
          </GoabCallout>
        )}
        {actions?.map((action) => (
          <GoabDetails key={action.name} heading={action.name} mt="m">
            <Json value={action} />
          </GoabDetails>
        ))}
      </Card>
      <Card title="Add action">
        <FormGrid>
          <GoabFormItem label="Action name" requirement="required" error={submitted ? nameError : undefined}>
            <GoabInput
              name="actionName"
              value={form.name}
              width="100%"
              error={submitted && !!nameError}
              onChange={(e) => setForm({ ...form, name: e.value.trim() })}
            />
          </GoabFormItem>
          <GoabFormItem label="Resource type" requirement="optional">
            <GoabInput
              name="resourceType"
              value={form.resourceType}
              width="100%"
              onChange={(e) => setForm({ ...form, resourceType: e.value })}
            />
          </GoabFormItem>
          {select('category', CATEGORIES, 'Category')}
          {select('severity', SEVERITIES, 'Severity')}
          {select('retentionClass', RETENTION_CLASSES, 'Retention class')}
        </FormGrid>
        <GoabFormItem label="Description" requirement="optional" mt="xl">
          <GoabInput
            name="description"
            value={form.description}
            width="100%"
            onChange={(e) => setForm({ ...form, description: e.value })}
          />
        </GoabFormItem>
        <GoabBlock mt="xl">
          <GoabButton type="primary" onClick={add}>
            Add action
          </GoabButton>
        </GoabBlock>
        {added && (
          <GoabCallout type="success" mt="l">
            {added}
          </GoabCallout>
        )}
      </Card>
      <ErrorCallout message={error} />
    </>
  );
}
