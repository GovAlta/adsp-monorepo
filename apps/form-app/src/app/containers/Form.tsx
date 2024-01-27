import { Renderers } from '@abgov/jsonforms-components';
import { GoABadge, GoACallout } from '@abgov/react-components-new';
import { Container, Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import moment from 'moment';
import { useEffect } from 'react';
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
  updateForm,
} from '../state';
import styled from 'styled-components';
import { LoadingIndicator } from '../components/LoadingIndicator';

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

export const Form = () => {
  const { formId } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const definition = useSelector(definitionSelector);
  const form = useSelector(formSelector);
  const data = useSelector(dataSelector);
  const files = useSelector(filesSelector);
  const busy = useSelector(busySelector);

  useEffect(() => {
    if (form?.id !== formId) {
      dispatch(loadForm(formId));
    }
  }, [dispatch, form, formId]);

  return (
    <>
      <LoadingIndicator isLoading={busy.loading} />
      <Container vs={3} hs={1} key={formId}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <SavingIndicator data-saving={busy.saving}>
              <GoABadge type="information" content="Saving..." />
            </SavingIndicator>
          </GridItem>
          <GridItem md={1} />
        </Grid>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            {definition && form && (
              <>
                {form.status === 'submitted' && (
                  <GoACallout type="success" heading="We're processing your application">
                    Your application was received on {moment(form.submitted).format('MMMM D, YYYY')}, and we're working
                    on it.
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
    </>
  );
};
