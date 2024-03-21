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

export const JSONFormPreviewer = (props: JSONFormPreviewerProps): JSX.Element => {
  const { schema, uischema, data, onChange } = props;
  const [lastGoodUiSchema, setLastGoodUiSchema] = React.useState<UISchemaElement>();
  const [lastGoodSchema, setLastGoodSchema] = React.useState<JsonSchema>({});
  const [dataSchemaError, setDataSchemaError] = React.useState<string>();
  const [uiSchemaError, setUiSchemaError] = React.useState<string>();
  const [isWrapped, setIsWrapped] = React.useState(false);
  const parsedUiSchema = parseUiSchema<UISchemaElement>(uischema);
  const parsedDataSchema = parseDataSchema<UISchemaElement>(schema);

  useEffect(() => {
    if (!parsedUiSchema.hasError()) {
      if (uiSchemaError) {
        setUiSchemaError(undefined);
      }
      setLastGoodUiSchema(parsedUiSchema.get());
    } else if (!uiSchemaError) {
      setUiSchemaError(parsedUiSchema.error());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uischema]);

  useEffect(() => {
    if (!parsedDataSchema.hasError()) {
      setLastGoodSchema(parsedDataSchema.get());
      if (dataSchemaError) {
        setDataSchemaError(undefined);
      }
    } else {
      setDataSchemaError(parsedDataSchema.error());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  useEffect(() => {
    const hasError = dataSchemaError || uiSchemaError;
    if (hasError && !isWrapped) {
      setIsWrapped(true);
      setLastGoodUiSchema(uiSchemaWrapper(lastGoodUiSchema, hasError));
    } else if (!hasError && isWrapped) {
      setLastGoodUiSchema(parsedUiSchema.get());
      setIsWrapped(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSchemaError, uiSchemaError]);

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
