import { ContextProviderFactory, GoAReviewRenderers } from '@abgov/jsonforms-components';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent } from 'react';
import { LoadingIndicator } from './LoadingIndicator';

const ContextProvider = ContextProviderFactory();

interface SubmittedFormProps {
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  data: Record<string, unknown>;
}

export const FormViewer: FunctionComponent<SubmittedFormProps> = ({ dataSchema, uiSchema, data }) => {
  return dataSchema && uiSchema ? (
    <ContextProvider isFormSubmitted={true}>
      <JsonForms
        readonly={true}
        schema={dataSchema}
        uischema={uiSchema}
        data={data}
        validationMode="NoValidation"
        renderers={GoAReviewRenderers}
      />
    </ContextProvider>
  ) : (
    <LoadingIndicator isLoading={true} />
  );
};
