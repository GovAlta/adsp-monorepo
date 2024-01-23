import { Renderers } from '@abgov/jsonforms-components';
import { JsonForms } from '@jsonforms/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-6';
import { AppDispatch, dataSelector, definitionSelector, formSelector, loadForm, updateForm } from '../state';
import { Container, Grid, GridItem } from '@core-services/app-common';

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
          <Grid>
            <GridItem md={12} className="center">
              {definition && (
                <JsonForms
                  schema={definition.dataSchema}
                  uischema={definition.uiSchema}
                  data={data}
                  validationMode="ValidateAndShow"
                  renderers={renderer.GoARenderers}
                  onChange={({ data }) => dispatch(updateForm({ data }))}
                />
              )}
            </GridItem>
          </Grid>
        </GridItem>
        <GridItem md={1} />
      </Grid>
    </Container>
  );
};
