import { GoARenderers } from '@abgov/jsonforms-components';
import { GoAIconButton } from '@abgov/react-components-new';
import { Container } from '@core-services/app-common';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-6';
import {
  AppDispatch,
  busySelector,
  canSubmitSelector,
  dataSelector,
  definitionSelector,
  filesSelector,
  formSelector,
  loadForm,
  selectTopic,
  selectedTopicSelector,
  submitForm,
  updateForm,
} from '../state';
import styled from 'styled-components';
import { LoadingIndicator } from '../components/LoadingIndicator';
import CommentsViewer from './CommentsViewer';
import { DraftForm } from '../components/DraftForm';
import { SubmittedForm } from '../components/SubmittedForm';

const SavingIndicator = styled.span`
  display: flex;
  flex-direction: row-reverse;
  opacity: 0;
  transition: opacity 400ms;

  &[data-saving='true'] {
    opacity: 1;
  }
`;

interface FormProps {
  className?: string;
}

const FormComponent: FunctionComponent<FormProps> = ({ className }) => {
  const { formId } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const definition = useSelector(definitionSelector);
  const form = useSelector(formSelector);
  const data = useSelector(dataSelector);
  const files = useSelector(filesSelector);
  const busy = useSelector(busySelector);
  const topic = useSelector(selectedTopicSelector);
  const canSubmit = useSelector(canSubmitSelector);

  useEffect(() => {
    dispatch(loadForm(formId));
  }, [dispatch, formId]);

  const [showComments, setShowComments] = useState(false);

  return (
    <div key={formId}>
      <LoadingIndicator isLoading={busy.loading} />
      <div className={className} data-show={showComments}>
        <Container vs={3} hs={1} key={formId}>
          {definition && form && (
            <>
              {form.status === 'submitted' && <SubmittedForm definition={definition} form={form} data={data} />}
              {form.status === 'draft' && (
                <DraftForm
                  definition={definition}
                  form={form}
                  data={data}
                  canSubmit={canSubmit}
                  saving={busy.saving}
                  onChange={({ data, errors }) =>
                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors }))
                  }
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
    overflow: auto;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 70%;
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

  .savingIndicator {
    display: flex;
    flex-direction: row-reverse;
    opacity: 0;
    transition: opacity 50ms;

    &[data-saving='true'] {
      opacity: 1;
      transition-duration: 1500ms;
    }
  }

  & > :last-child {
    z-index: 3;
    position: absolute;
    bottom: var(--goa-spacing-l);
    left: var(--goa-spacing-l);
    background: white;
  }

  &[data-show='true'] > :last-child {
    background: var(--goa-color-greyscale-100);
  }
`;
