// apps/form-app/src/app/containers/Form.tsx
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  AppDispatch,
  AppState,
  definitionSelector,
  formSelector,
  dataSelector,
  filesSelector,
  busySelector,
  selectedTopicSelector,
  canSubmitSelector,
  showSubmitSelector,
  submitForm,
  updateForm,
  loadForm,
} from '../state';

import { LogoutModal } from '../components/LogoutModal';
import { SubmittedForm } from '../components/SubmittedForm';
import { CommentsViewer } from './CommentsViewer';
import { DraftFormWrapper } from '../components/DraftFormWrapper';

// ---------- styled ----------
const Page = styled.div<{ 'data-show': boolean }>`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;

  .commentsPane {
    position: sticky;
    top: 24px;
    height: calc(100vh - 48px);
    overflow: auto;
  }

  &[data-show='false'] .commentsPane {
    display: none;
  }
`;

const Container = styled.div<{ vs?: number; hs?: number }>`
  padding: 16px;
`;

// ---------- helpers ----------
/**
 * Option A: clone definition and add uiSchema.options.historySync
 * basePath example: `/${tenant}/${definitionId}/${formId}`
 */
function withHistorySync<T extends { uiSchema?: any }>(definition: T | undefined, basePath: string | undefined) {
  if (!definition || !definition.uiSchema || !basePath) return definition;
  const currentOpts = (definition.uiSchema.options ?? {}) as Record<string, unknown>;
  const next = {
    ...definition,
    uiSchema: {
      ...definition.uiSchema,
      options: {
        ...currentOpts,
        historySync: {
          enabled: true,
          basePath,
          strategy: 'path', // keep path strategy
          includeReview: true,
          mode: 'replace', // avoid growing history stack on each step
        },
      },
    },
  };
  return next as T;
}

// ---------- component ----------
interface FormProps {
  className?: string;
}

const FormComponent: FunctionComponent<FormProps> = ({ className }) => {
  const { tenant, definitionId, formId, stepSlug, pageSlug } = useParams<{
    tenant: string;
    definitionId: string;
    formId: string;
    stepSlug?: string;
    pageSlug?: string;
  }>();

  const dispatch = useDispatch<AppDispatch>();

  // Base path used by History API adapter (no trailing slash)
  const basePath = useMemo(() => {
    const p = `/${tenant}/${definitionId}/${formId}`;
    return p.endsWith('/') ? p.slice(0, -1) : p;
  }, [tenant, definitionId, formId]);

  // State from store
  const { definition } = useSelector(definitionSelector);
  const form = useSelector((state: AppState) => formSelector(state, formId));
  const data = useSelector(dataSelector);
  const files = useSelector(filesSelector);
  const busy = useSelector(busySelector);
  const topic = useSelector(selectedTopicSelector);
  const canSubmit = useSelector(canSubmitSelector);
  const showSubmit = useSelector(showSubmitSelector);

  // Add historySync to uiSchema (Option A)
  const definitionWithHistory = useMemo(() => withHistorySync(definition, basePath), [definition, basePath]);

  // Load form on mount / formId change
  useEffect(() => {
    if (formId) {
      dispatch(loadForm(formId));
    }
  }, [dispatch, formId]);

  // Debug prints to confirm routing params/basePath
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[FORM] params', { tenant, definitionId, formId, stepSlug, pageSlug });
    // eslint-disable-next-line no-console
    console.log('[FORM] basePath', basePath);
  }, [tenant, definitionId, formId, stepSlug, pageSlug, basePath]);

  const [showComments, setShowComments] = useState(false);

  return (
    <div key={formId}>
      {definition && !definition.anonymousApply && <LogoutModal />}

      <Page className={className} data-show={showComments}>
        <Container vs={1} hs={1}>
          {form && !busy.loading && (
            <>
              {form.status === 'Submitted' ? (
                <SubmittedForm definition={definitionWithHistory ?? definition} form={form} data={data} />
              ) : (
                <DraftFormWrapper
                  definition={definitionWithHistory ?? definition}
                  form={form}
                  data={data}
                  canSubmit={canSubmit}
                  showSubmit={showSubmit}
                  saving={busy.saving}
                  submitting={busy.submitting}
                  onChange={({ data, errors }) => {
                    // tolerate enum display mismatches
                    if (
                      errors?.[0]?.message === 'should be equal to one of the allowed values' &&
                      errors?.[0]?.schemaPath?.includes('enum')
                    ) {
                      errors = null as any;
                    }
                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors }));
                  }}
                  onSave={({ data, errors }) => {
                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors }));
                  }}
                  onSubmit={(f) => dispatch(submitForm(f.id))}
                />
              )}
            </>
          )}
        </Container>

        <div className="commentsPane">
          <CommentsViewer />
        </div>

        {/* Toggle comments via icon button elsewhere in your layout if needed */}
        {topic ? <span /> : <span />}
      </Page>
    </div>
  );
};

export const Form = styled(FormComponent)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row-reverse;

  @media (max-width: 639px) {
    flex-direction: column;
  }

  > :first-child {
    position: relative;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 70%;
    overflow: auto;
    padding-bottom: var(--goa-space-2xl);
  }

  .commentsPane {
    display: none;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 30%;
    border-right: 1px solid var(--goa-color-greyscale-200);
    background: white;
    > * {
      min-width: 300px;
      height: 100%;
    }

    @media (max-width: 639px) {
      z-index: 2;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }

  &[data-show='true'] .commentsPane {
    display: block;
  }

  & > :last-child {
    z-index: 3;
    position: absolute;
    bottom: var(--goa-space-l);
    left: var(--goa-space-l);
    background: white;
  }

  &[data-show='true'] > :last-child {
    background: var(--goa-color-greyscale-100);
  }
`;
