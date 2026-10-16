import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCircularProgress,
  GoabDetails,
  GoabFormItem,
  GoabModal,
  GoabTable,
  GoabTextArea,
} from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { BusinessPattern, PatternInput, PatternSource } from './model';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const sourceBadge: Record<PatternSource, { type: 'information' | 'important' | 'success'; label: string }> = {
  'built-in': { type: 'information', label: 'Built-in' },
  customized: { type: 'important', label: 'Customized' },
  custom: { type: 'success', label: 'Custom' },
};

// Limits mirror the planner service validation.
const LIMITS = {
  name: 100,
  description: 2000,
  domainLanguage: 100,
  signals: 50,
  mappings: 30,
  list: 50,
  signalText: 500,
  mappingReason: 500,
};

interface PatternFields {
  name: string;
  description: string;
  domainLanguage: string;
  commonFeatures: string;
  strongSignals: string;
  weakSignals: string;
  serviceMappings: string;
  clarifyingQuestions: string;
  assumptions: string;
  knownUnknowns: string;
}

type FieldKey = keyof PatternFields;

const FIELDS: { key: FieldKey; label: string; help?: string; rows: number; required?: boolean }[] = [
  { key: 'name', label: 'Business pattern (name)', rows: 1, required: true },
  { key: 'description', label: 'Purpose', rows: 3, required: true },
  {
    key: 'domainLanguage',
    label: 'Common domain language',
    help: 'One term per line.',
    rows: 4,
    required: true,
  },
  { key: 'commonFeatures', label: 'Common features', help: 'One feature per line.', rows: 4 },
  {
    key: 'strongSignals',
    label: 'Strong confidence signals',
    help: 'One per line: description | keyword, keyword',
    rows: 5,
    required: true,
  },
  {
    key: 'weakSignals',
    label: 'Weak or misleading signals',
    help: 'One per line: description | keyword, keyword',
    rows: 4,
  },
  {
    key: 'serviceMappings',
    label: 'Likely ADSP service mappings',
    help: 'One per line: service-name: reason',
    rows: 5,
    required: true,
  },
  { key: 'clarifyingQuestions', label: 'Clarifying questions', help: 'One question per line.', rows: 4 },
  { key: 'assumptions', label: 'Assumptions', help: 'One assumption per line.', rows: 3 },
  { key: 'knownUnknowns', label: 'Known unknowns', help: 'One per line.', rows: 3 },
];

const lines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const toSignals = (value: string) =>
  lines(value).map((line) => {
    const [description, keywords = ''] = line.split('|');
    return {
      description: description.trim(),
      keywords: keywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    };
  });

const toMappings = (value: string) =>
  lines(value).map((line) => {
    const index = line.indexOf(':');
    return {
      service: (index < 0 ? line : line.slice(0, index)).trim(),
      reason: index < 0 ? '' : line.slice(index + 1).trim(),
    };
  });

const signalText = (signals: BusinessPattern['strongSignals']) =>
  (signals || []).map((s) => `${s.description} | ${s.keywords.join(', ')}`).join('\n');

const toFields = (pattern?: BusinessPattern): PatternFields => ({
  name: pattern?.name || '',
  description: pattern?.description || '',
  domainLanguage: (pattern?.domainLanguage || []).join('\n'),
  commonFeatures: (pattern?.commonFeatures || []).join('\n'),
  strongSignals: signalText(pattern?.strongSignals),
  weakSignals: signalText(pattern?.weakSignals),
  serviceMappings: (pattern?.serviceMappings || []).map((m) => `${m.service}: ${m.reason}`).join('\n'),
  clarifyingQuestions: (pattern?.clarifyingQuestions || []).join('\n'),
  assumptions: (pattern?.assumptions || []).join('\n'),
  knownUnknowns: (pattern?.knownUnknowns || []).join('\n'),
});

const toInput = (fields: PatternFields): PatternInput => ({
  name: fields.name.trim(),
  description: fields.description.trim(),
  domainLanguage: lines(fields.domainLanguage),
  commonFeatures: lines(fields.commonFeatures),
  strongSignals: toSignals(fields.strongSignals),
  weakSignals: toSignals(fields.weakSignals),
  serviceMappings: toMappings(fields.serviceMappings),
  clarifyingQuestions: lines(fields.clarifyingQuestions),
  assumptions: lines(fields.assumptions),
  knownUnknowns: lines(fields.knownUnknowns),
});

type FieldErrors = Partial<Record<FieldKey, string>>;

const validate = (input: PatternInput): FieldErrors => {
  const errors: FieldErrors = {};
  if (!input.name) {
    errors.name = 'Name is required.';
  } else if (input.name.length > LIMITS.name) {
    errors.name = `Name must be ${LIMITS.name} characters or fewer.`;
  }
  if (!input.description) {
    errors.description = 'Purpose is required.';
  } else if (input.description.length > LIMITS.description) {
    errors.description = `Purpose must be ${LIMITS.description} characters or fewer.`;
  }
  if (input.domainLanguage.length < 1) {
    errors.domainLanguage = 'Add at least one domain term.';
  } else if (input.domainLanguage.length > LIMITS.domainLanguage) {
    errors.domainLanguage = `Add no more than ${LIMITS.domainLanguage} terms.`;
  }
  if (input.strongSignals.length < 1) {
    errors.strongSignals = 'Add at least one strong signal.';
  }
  for (const key of ['strongSignals', 'weakSignals'] as const) {
    const signals = input[key];
    if (signals.length > LIMITS.signals) {
      errors[key] = `Add no more than ${LIMITS.signals} signals.`;
    } else if (signals.some((s) => s.keywords.length < 1 || s.description.length > LIMITS.signalText)) {
      errors[key] =
        `Each signal needs a description (up to ${LIMITS.signalText} characters) and at least one keyword after "|".`;
    }
  }
  if (input.serviceMappings.length < 1) {
    errors.serviceMappings = 'Add at least one service mapping.';
  } else if (input.serviceMappings.length > LIMITS.mappings) {
    errors.serviceMappings = `Add no more than ${LIMITS.mappings} service mappings.`;
  } else if (input.serviceMappings.some((m) => !m.service || !m.reason || m.reason.length > LIMITS.mappingReason)) {
    errors.serviceMappings = `Each mapping needs a service and a reason (up to ${LIMITS.mappingReason} characters), as "service-name: reason".`;
  }
  for (const key of ['commonFeatures', 'clarifyingQuestions', 'assumptions', 'knownUnknowns'] as const) {
    if (input[key].length > LIMITS.list) {
      errors[key] = `Add no more than ${LIMITS.list} entries.`;
    }
  }
  return errors;
};

const detailSections = (pattern: BusinessPattern): [string, string[] | undefined][] => [
  ['Common domain language', pattern.domainLanguage],
  ['Common features', pattern.commonFeatures],
  ['Strong confidence signals', pattern.strongSignals?.map((s) => s.description)],
  ['Weak or misleading signals', pattern.weakSignals?.map((s) => s.description)],
  ['Clarifying questions', pattern.clarifyingQuestions],
  ['Assumptions', pattern.assumptions],
  ['Known unknowns', pattern.knownUnknowns],
];

interface EditState {
  id?: string;
  fields: PatternFields;
}

interface PatternManagerProps {
  api: PlannerApi;
  canEdit?: boolean;
}

export const PatternManager: FunctionComponent<PatternManagerProps> = ({ api, canEdit = false }) => {
  const [patterns, setPatterns] = useState<BusinessPattern[]>();
  const [editing, setEditing] = useState<EditState>();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [deleting, setDeleting] = useState<BusinessPattern>();
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api
        .listPatterns()
        .then(setPatterns)
        .catch(() => setPatterns([])),
    [api],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (pattern?: BusinessPattern) => {
    setErrors({});
    setEditing({ id: pattern?.id, fields: toFields(pattern) });
  };

  const save = async () => {
    const input = toInput(editing.fields);
    const found = validate(input);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setBusy(true);
    try {
      if (editing.id) {
        await api.updatePattern(editing.id, input);
      } else {
        await api.createPattern(input);
      }
      setEditing(undefined);
      await load();
    } catch {
      // The api reports the server error; keep the form open so the input is not lost.
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    const pattern = deleting;
    setBusy(true);
    try {
      await api.deletePattern(pattern.id);
      setDeleting(undefined);
      await load();
    } catch {
      setDeleting(undefined);
    } finally {
      setBusy(false);
    }
  };

  if (!patterns) {
    return <GoabCircularProgress visible message="Loading patterns..." size="small" />;
  }

  if (editing) {
    const isEditingValid = Object.keys(validate(toInput(editing.fields))).length === 0;
    return (
      <section aria-labelledby="pattern-editor-heading">
        <h2 id="pattern-editor-heading" data-testid="pattern-editor-heading">
          {editing.id ? `Edit pattern: ${editing.id}` : 'New pattern'}
        </h2>
        <Stack>
          {FIELDS.map(({ key, label, help, rows, required }) => (
            <GoabFormItem
              key={key}
              label={label}
              helpText={help}
              error={errors[key]}
              requirement={required ? 'required' : undefined}
              mb="m"
            >
              <GoabTextArea
                name={`pattern-${key}`}
                value={editing.fields[key]}
                rows={rows}
                width="100%"
                testId={`pattern-field-${key}`}
                disabled={busy}
                onChange={(detail) => setEditing({ ...editing, fields: { ...editing.fields, [key]: detail.value } })}
              />
            </GoabFormItem>
          ))}
          <GoabButtonGroup alignment="start">
            <GoabButton disabled={busy || !isEditingValid} testId="pattern-save" onClick={save}>
              Save pattern
            </GoabButton>
            <GoabButton type="tertiary" disabled={busy} testId="pattern-cancel" onClick={() => setEditing(undefined)}>
              Cancel
            </GoabButton>
          </GoabButtonGroup>
        </Stack>
      </section>
    );
  }

  return (
    <section>
      <p>Business patterns the planner uses to recognise your problem.</p>
      {canEdit && (
        <GoabButton size="compact" mb="m" testId="pattern-new" onClick={() => startEdit()}>
          New pattern
        </GoabButton>
      )}
      <GoabTable width="100%" testId="patterns-table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Description</th>
            <th>Commonly used services</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {patterns.map((pattern) => {
            const source = sourceBadge[pattern.source || 'built-in'];
            return (
              <tr key={pattern.id}>
                <td>
                  {pattern.name}
                  <br />
                  <GoabBadge
                    type={source.type}
                    content={source.label}
                    emphasis="subtle"
                    testId={`pattern-source-${pattern.id}`}
                  />
                </td>
                <td>
                  {pattern.description}
                  {detailSections(pattern).map(
                    ([heading, items]) =>
                      items?.length > 0 && (
                        <GoabDetails heading={heading} key={heading}>
                          <ul>
                            {items.map((item, i) => (
                              <li key={`${i}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </GoabDetails>
                      ),
                  )}
                </td>
                <td>
                  <ul>
                    {pattern.serviceMappings.map((m) => (
                      <li key={m.service}>
                        <b>{m.service}</b>: {m.reason}
                      </li>
                    ))}
                  </ul>
                </td>
                {canEdit && (
                  <td>
                    <ActionRow>
                      <GoabButton
                        size="compact"
                        type="secondary"
                        testId={`pattern-edit-${pattern.id}`}
                        onClick={() => startEdit(pattern)}
                      >
                        Edit
                      </GoabButton>
                      {pattern.source !== 'built-in' && (
                        <GoabButton
                          size="compact"
                          type="secondary"
                          variant="destructive"
                          testId={`pattern-delete-${pattern.id}`}
                          onClick={() => setDeleting(pattern)}
                        >
                          {pattern.source === 'customized' ? 'Revert' : 'Delete'}
                        </GoabButton>
                      )}
                    </ActionRow>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </GoabTable>
      {deleting && (
        <GoabModal
          open
          testId="pattern-delete-modal"
          heading={deleting.source === 'customized' ? 'Revert this pattern?' : 'Delete this pattern?'}
          calloutVariant="emergency"
          onClose={() => setDeleting(undefined)}
          actions={
            <GoabButtonGroup alignment="end" mt="m">
              <GoabButton
                size="compact"
                type="secondary"
                disabled={busy}
                testId="pattern-delete-cancel"
                onClick={() => setDeleting(undefined)}
              >
                Cancel
              </GoabButton>
              <GoabButton
                size="compact"
                variant="destructive"
                disabled={busy}
                testId="pattern-delete-confirm"
                onClick={confirmDelete}
              >
                {deleting.source === 'customized' ? 'Revert' : 'Delete'}
              </GoabButton>
            </GoabButtonGroup>
          }
        >
          {deleting.source === 'customized' ? (
            <>
              This action cannot be undone. <strong>{deleting.name}</strong> will be reverted to its built-in definition
              and your customizations will be removed.
            </>
          ) : (
            <>
              This action cannot be undone. <strong>{deleting.name}</strong> will be permanently removed.
            </>
          )}
        </GoabModal>
      )}
    </section>
  );
};
