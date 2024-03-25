import { GoARenderers } from '@abgov/jsonforms-components';
import { GoACallout } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import moment from 'moment';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { Form, FormDefinition } from '../state';

interface ApplicationStatusProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
}

const Heading = styled.h2`
  margin-top: var(--goa-space-3xl);
  margin-bottom: var(--goa-space-xl);
`;

export const SubmittedForm: FunctionComponent<ApplicationStatusProps> = ({ definition, form, data }) => {
  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <GoACallout type="success" heading="We're processing your application">
          Your application was received on {moment(form.submitted).format('MMMM D, YYYY')} and we're working on it.
        </GoACallout>
        <Heading>The submitted form for your reference</Heading>
        <JsonForms
          readonly={true}
          schema={definition.dataSchema}
          uischema={definition.uiSchema}
          data={data}
          validationMode="NoValidation"
          renderers={GoARenderers}
        />
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
