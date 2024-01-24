import { Renderers } from '@abgov/jsonforms-components';
import { GoACallout } from '@abgov/react-components-new';
import { Container, Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import moment from 'moment';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-6';
import { AppDispatch, dataSelector, definitionSelector, formSelector, loadForm, updateForm } from '../state';

const renderer = new Renderers();

export const Form = () => {
  const { formId } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const definition = useSelector(definitionSelector);
  const { form } = useSelector(formSelector);
  const data = useSelector(dataSelector);

  useEffect(() => {
    if (form?.id !== formId) {
      dispatch(loadForm(formId));
    }
  }, [dispatch, form, formId]);

  return (
    <Container vs={3} hs={1} key={formId}>
      <Grid>
        <GridItem md={1} />
        <GridItem md={10}>
          {definition && form && (
            <>
              {form.status === 'submitted' && (
                <GoACallout type="success" heading="We're processing your application">
                  Your application was received on {moment(form.submitted).format('MMMM D, YYYY')}, and we're working on
                  it.
                </GoACallout>
              )}
              <JsonForms
                readonly={form.status !== 'draft'}
                schema={definition.dataSchema}
                uischema={definition.uiSchema}
                data={data}
                validationMode="ValidateAndShow"
                renderers={renderer.GoARenderers}
                onChange={({ data }) => dispatch(updateForm({ data }))}
              />
            </>
          )}
        </GridItem>
        <GridItem md={1} />
      </Grid>
    </Container>
  );
};
