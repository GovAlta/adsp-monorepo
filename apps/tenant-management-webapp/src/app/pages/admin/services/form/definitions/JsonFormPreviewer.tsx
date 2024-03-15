import React, { useEffect } from 'react';
import { ajv } from '@lib/validation/checkInput';
import { JsonForms } from '@jsonforms/react';
import { ErrorBoundary } from 'react-error-boundary';
import { GoARenderers } from '@abgov/jsonforms-components';
import { vanillaCells } from '@jsonforms/vanilla-renderers';
import { parseDataSchema, parseUiSchema } from './schemaUtils';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { uiSchemaWrapper } from './schemaWrappers';
import FallbackRender from './FallbackRenderer';

interface JSONFormPreviewerProps {
  schema: string;
  data: unknown;
  uischema: string;
  onChange: (data) => void;
}

// Give something valid, at startup, that shows a blank preview.
const defaultSchema = {};
const defaultUiSchema = { type: 'VerticalLayout', elements: [] };

export const JSONFormPreviewer = (props: JSONFormPreviewerProps): JSX.Element => {
  const { schema, uischema, data, onChange } = props;
  const [lastGoodUiSchema, setLastGoodUiSchema] = React.useState<UISchemaElement>(defaultUiSchema);
  const [lastGoodSchema, setLastGoodSchema] = React.useState<JsonSchema>(defaultSchema);
  const [hasDataSchemaError, setHasDataSchemaError] = React.useState(false);
  const [hasUiSchemaError, setHasUiSchemaError] = React.useState(false);
  const [isWrapped, setIsWrapped] = React.useState(false);
  const parsedUiSchema = parseUiSchema<UISchemaElement>(uischema);
  const parsedDataSchema = parseDataSchema<UISchemaElement>(schema);

  useEffect(() => {
    if (!parsedUiSchema.hasError()) {
      if (hasUiSchemaError) {
        setHasUiSchemaError(false);
      }
      setLastGoodUiSchema(parsedUiSchema.get());
    } else if (!hasUiSchemaError) {
      setHasUiSchemaError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uischema]);

  useEffect(() => {
    if (!parsedDataSchema.hasError()) {
      setLastGoodSchema(parsedDataSchema.get());
      if (hasDataSchemaError) {
        setHasDataSchemaError(false);
      }
    } else {
      setHasDataSchemaError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  useEffect(() => {
    const hasError = hasDataSchemaError || hasUiSchemaError;
    if (hasError && !isWrapped) {
      setIsWrapped(true);
      setLastGoodUiSchema(uiSchemaWrapper(lastGoodUiSchema));
    } else if (!hasError && isWrapped) {
      setLastGoodUiSchema(parsedUiSchema.get());
      setIsWrapped(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDataSchemaError, hasUiSchemaError]);

  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      <JsonForms
        ajv={ajv}
        renderers={GoARenderers}
        cells={vanillaCells}
        onChange={onChange}
        data={data}
        validationMode={'ValidateAndShow'}
        schema={lastGoodSchema}
        uischema={lastGoodUiSchema}
      />
    </ErrorBoundary>
  );
};
