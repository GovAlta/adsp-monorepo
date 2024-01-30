import { Renderers } from '@abgov/jsonforms-components';
import { GoABadge, GoACallout, GoAIconButton } from '@abgov/react-components-new';
import { Container, Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import moment from 'moment';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-6';
import {
  AppDispatch,
  busySelector,
  dataSelector,
  definitionSelector,
  filesSelector,
  formSelector,
  loadForm,
  selectTopic,
  selectedTopicSelector,
  updateForm,
} from '../state';
import styled from 'styled-components';
import { LoadingIndicator } from '../components/LoadingIndicator';
import CommentsViewer from './CommentsViewer';

const renderer = new Renderers();

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

  useEffect(() => {
    dispatch(loadForm(formId));
  }, [dispatch, formId]);

  const [showComments, setShowComments] = useState(false);

  return (
    <div key={formId}>
      <LoadingIndicator isLoading={busy.loading} />
      <div className={className}>
        <Container vs={3} hs={1} key={formId}>
          <Grid>
            <GridItem md={1} />
            <GridItem md={10}>
              <div className="savingIndicator" data-saving={busy.saving}>
                <GoABadge type="information" content="Saving..." />
              </div>
              {definition && form && (
                <>
                  {form.status === 'submitted' && (
                    <GoACallout type="success" heading="We're processing your application">
                      Your application was received on {moment(form.submitted).format('MMMM D, YYYY')}, and we're
                      working on it.
                    </GoACallout>
                  )}
                  <JsonForms
                    readonly={form.status !== 'draft'}
                    schema={definition.dataSchema}
                    uischema={definition.uiSchema}
                    data={data}
                    validationMode="ValidateAndShow"
                    renderers={renderer.GoARenderers}
                    onChange={({ data }) => dispatch(updateForm({ data, files }))}
                  />
                </>
              )}
            </GridItem>
            <GridItem md={1} />
          </Grid>
        </Container>
        <div className="commentsPane" data-show={showComments}>
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
  }

  .commentsPane[data-show='true'] {
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
    z-index: 2;
    position: absolute;
    bottom: var(--goa-spacing-l);
    left: var(--goa-spacing-l);
  }
`;
