import React from 'react';
import { ajv } from '@lib/validation/checkInput';
import { JsonForms } from '@jsonforms/react';
import { ErrorBoundary } from 'react-error-boundary';
import { GoARenderers } from '@abgov/jsonforms-components';
import { vanillaCells } from '@jsonforms/vanilla-renderers';
import { parseDataSchema, parseUiSchema } from './schemaUtils';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { GoABadge, GoAButton } from '@abgov/react-components-new';

function FallbackRender({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <GoABadge type="emergency" content="Unexpected error in JSON Form" />
      <pre>{error.message}</pre>
      <GoAButton
        onClick={() => {
          resetErrorBoundary();
        }}
      >
        Reset JSON Forms
      </GoAButton>
    </div>
  );
}

interface JSONFormPreviewerProps {
  schema: string;
  data: unknown;
  uischema: string;
  onChange: (data) => void;
}

export const JSONFormPreviewer = (props: JSONFormPreviewerProps): JSX.Element => {
  const { schema, uischema, data, onChange } = props;

  const parsedUiSchema = parseUiSchema<UISchemaElement>(uischema).get();
  const parsedSchema = parseDataSchema<JsonSchema>(schema).get();

  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      <JsonForms
        ajv={ajv}
        renderers={GoARenderers}
        cells={vanillaCells}
        onChange={onChange}
        data={data}
        validationMode={'ValidateAndShow'}
        schema={parsedSchema}
        uischema={parsedUiSchema}
      />
    </ErrorBoundary>
  );
};
