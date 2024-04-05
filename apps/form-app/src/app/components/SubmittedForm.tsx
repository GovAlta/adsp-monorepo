import { GoARenderers } from '@abgov/jsonforms-components';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { GoACallout } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import moment from 'moment';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { Form, FormDefinition, AppDispatch, downloadFile, propertyIdsWithFileMetaDataSelector } from '../state';
import { ContextProvider } from '@abgov/jsonforms-components';
import { useDispatch, useSelector } from 'react-redux';

interface ApplicationStatusProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
}

const Heading = styled.h2`
  margin-top: var(--goa-space-3xl);
  margin-bottom: var(--goa-space-xl);
`;

export const readOnlyUiSchema = (schema) => {
  const newSchema = JSON.parse(JSON.stringify(schema));
  setReadOnly(newSchema);
  addReadOnly(newSchema.elements);

  return newSchema as UISchemaElement;
};

const addReadOnly = (elements) => {
  Array.isArray(elements) &&
    elements.forEach((element) => {
      setReadOnly(element);
      addReadOnly(element.elements);
    });
};

const setReadOnly = (element) => {
  !element.options && (element.options = {});
  !element.options?.componentProps && (element.options.componentProps = {});
  element.options.componentProps.readOnly = true;
  return element;
};

export const SubmittedForm: FunctionComponent<ApplicationStatusProps> = ({ definition, form, data }) => {
  const downloadFormFile = async (file) => {
    const fileData = await dispatch(downloadFile(file.urn)).unwrap();
    const element = document.createElement('a');
    element.href = URL.createObjectURL(new Blob([fileData.data]));
    element.download = fileData.metadata.filename;
    document.body.appendChild(element);
    element.click();
  };

  const dispatch = useDispatch<AppDispatch>();

  const formPropertyIdsWithMetaData = useSelector(propertyIdsWithFileMetaDataSelector);

  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <GoACallout type="success" heading="We're processing your application">
          Your application was received on {moment(form.submitted).format('MMMM D, YYYY')} and we're working on it.
        </GoACallout>
        <Heading>The submitted form for your reference</Heading>
        <ContextProvider
          fileManagement={{
            fileList: formPropertyIdsWithMetaData,
            downloadFile: downloadFormFile,
          }}
        >
          <JsonForms
            readonly={true}
            schema={definition.dataSchema}
            uischema={readOnlyUiSchema(definition.uiSchema)}
            data={data}
            validationMode="NoValidation"
            renderers={GoARenderers}
          />
        </ContextProvider>
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
