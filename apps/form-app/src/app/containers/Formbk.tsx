import { GoAIconButton } from '@abgov/react-components';
import { Container } from '@core-services/app-common';
import { FunctionComponent, useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  AppState,
  busySelector,
  canSubmitSelector,
  dataSelector,
  definitionSelector,
  fileBusySelector,
  filesSelector,
  formSelector,
  loadForm,
  selectTopic,
  selectedTopicSelector,
  showSubmitSelector,
  submitForm,
  updateForm,
} from '../state';
import { DraftFormWrapper } from '../components/DraftFormWrapper';
import { LogoutModal } from '../components/LogoutModal';
import { SubmittedForm } from '../components/SubmittedForm';
import CommentsViewer from './CommentsViewer';
interface FormProps {
  className?: string;
}

const FormComponent: FunctionComponent<FormProps> = ({ className }) => {
  // const { formId } = useParams();
  const { tenant, definitionId, formId, stepSlug, pageSlug } = useParams<{
    tenant: string;
    definitionId: string;
    formId: string;
    stepSlug?: string;
    pageSlug?: string;
  }>();
  const dispatch = useDispatch<AppDispatch>();

  const basePath = useMemo(() => `/${tenant}/${definitionId}/${formId}`, [tenant, definitionId, formId]);
  const { definition } = useSelector(definitionSelector);
  const form = useSelector((state: AppState) => formSelector(state, formId));
  const data = useSelector(dataSelector);
  const files = useSelector(filesSelector);
  const busy = useSelector(busySelector);
  const fileBusy = useSelector(fileBusySelector);
  const topic = useSelector(selectedTopicSelector);
  const canSubmit = useSelector(canSubmitSelector);
  const showSubmit = useSelector(showSubmitSelector);

  useEffect(() => {
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = 'unset';
    }
  });

  useEffect(() => {
    dispatch(loadForm(formId));
  }, [dispatch, formId]);

  const uiWithHistory = useMemo(() => {
    if (!definition?.uiSchema) return undefined;
    return {
      ...definition.uiSchema,
      options: {
        ...definition.uiSchema.options,
        historySync: {
          enabled: true,
          basePath, // final url: /<tenant>/<def>/<form>/<stepSlug>
          strategy: 'path', // or 'query'/'hash'
          includeReview: true,
          mode: 'replace',
        },
      },
    };
  }, [definition?.uiSchema, basePath]);

  const [showComments, setShowComments] = useState(false);
  console.log('[FORM] params', { tenant, definitionId, formId, stepSlug, pageSlug });
  console.log('[FORM] basePath', basePath);
  return (
    <div key={formId}>
      {definition && !definition.anonymousApply && <LogoutModal />}
      <div className={className} data-show={showComments}>
        <Container vs={1} hs={1}>
          {form && !fileBusy.loading && (
            <>
              {form.status === 'Submitted' && <SubmittedForm definition={definition} form={form} data={data} />}
              {form.status === 'Draft' && (
                <DraftFormWrapper
                  definition={{ ...definition, uiSchema: uiWithHistory ?? definition.uiSchema }}
                  form={form}
                  data={data}
                  canSubmit={canSubmit}
                  showSubmit={showSubmit}
                  saving={busy.saving}
                  submitting={busy.submitting}
                  historySyncBasePath={basePath}
                  onChange={({ data, errors }) => {
                    if (
                      errors[0]?.message === 'should be equal to one of the allowed values' &&
                      errors[0]?.schemaPath.includes('enum')
                    ) {
                      errors = null;
                    }

                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors: errors }));
                  }}
                  onSave={({ data, errors }) => {
                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors: errors }));
                  }}
                  onSubmit={(form) => dispatch(submitForm(form.id))}
                />
              )}
            </>
          )}
        </Container>
        <div className="commentsPane">
          <CommentsViewer />
        </div>
        {topic ? (
          <GoAIconButton
            disabled={!form}
            icon={showComments ? 'help-circle' : 'help-circle'}
            size="large"
            title="Comments help"
            onClick={() => {
              setShowComments(!showComments);
              if (topic?.resourceId !== form?.urn) {
                dispatch(selectTopic({ resourceId: form.urn }));
              }
            }}
          />
        ) : (
          <span></span>
        )}
      </div>
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
