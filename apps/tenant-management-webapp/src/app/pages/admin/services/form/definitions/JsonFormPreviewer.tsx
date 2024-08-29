import React, { useEffect } from 'react';
import { ajv } from '@lib/validation/checkInput';
import { JsonForms } from '@jsonforms/react';
import { ErrorBoundary } from 'react-error-boundary';
import { GoARenderers, GoACells, JsonFormRegisterProvider } from '@abgov/jsonforms-components';
import { parseDataSchema, parseUiSchema } from './schemaUtils';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { uiSchemaWrapper } from './schemaWrappers';
import FallbackRender from './FallbackRenderer';
import { useDebounce } from '@lib/useDebounce';
import { useDispatch, useSelector } from 'react-redux';
import { selectRegisterData } from '@store/configuration/selectors';
import { RootState } from '@store/index';
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

  const debouncedUiSchema = useDebounce(uischema, 100);
  const [display, setDisplay] = React.useState<boolean>(true);
  const dispatch = useDispatch();
  const registerData = useSelector(selectRegisterData);
  const nonAnonymous = useSelector((state: RootState) => state.configuration?.nonAnonymous);
  const dataList = useSelector((state: RootState) => state.configuration?.dataList);

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
    setDisplay(false);
  }, [debouncedUiSchema]);

  useEffect(() => {
    if (!display) {
      setDisplay(true);
    }
  }, [display]);

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
      {display && (
        <JsonFormRegisterProvider
          defaultRegisters={{ registerData: registerData, dataList: dataList, nonAnonymous: nonAnonymous } || undefined}
        >
          <JsonForms
            ajv={ajv}
            renderers={GoARenderers}
            cells={GoACells}
            onChange={onChange}
            data={data}
            validationMode={'ValidateAndShow'}
            //need to re-create the schemas here in order to trigger a refresh when passing data back through the context
            schema={{ ...lastGoodSchema }}
            uischema={{ ...lastGoodUiSchema }}
          />
        </JsonFormRegisterProvider>
      )}
    </ErrorBoundary>
  );
};
