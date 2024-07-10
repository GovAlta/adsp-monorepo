import React, { useEffect, useState } from 'react';
import { ajv } from '@lib/validation/checkInput';
import addFormats from 'ajv-formats';
import { JsonForms } from '@jsonforms/react';
import { ErrorBoundary } from 'react-error-boundary';
import { GoARenderers, GoACells, JsonFormRegisterProvider } from '@abgov/jsonforms-components';
import { getRefDefinitions } from '@store/form/action';
import { parseDataSchema, parseUiSchema } from './schemaUtils';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { uiSchemaWrapper } from './schemaWrappers';
import FallbackRender from './FallbackRenderer';
import { useDebounce } from '@lib/useDebounce';
import { useDispatch, useSelector } from 'react-redux';
import { selectRegisterData } from '@store/configuration/selectors';
import { RootState } from '@store/index';
import { AnySchema } from 'ajv';

interface JSONFormPreviewerProps {
  schema: string;
  data: unknown;
  uischema: string;
  onChange: (data) => void;
}

function getRefs(schema) {
  const refs = [];

  function findRefs(obj) {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key === '$ref') {
          refs.push(obj);
        } else if (typeof obj[key] === 'object') {
          findRefs(obj[key]);
        }
      }
    }
  }

  findRefs(schema);
  return refs;
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

  const [extraRefs, setExtraRefs] = useState({});

  const debouncedUiSchema = useDebounce(uischema, 100);
  const [display, setDisplay] = React.useState<boolean>(true);
  const dispatch = useDispatch();
  const registerData = useSelector(selectRegisterData);

  const refDefinitions = useSelector((state: RootState) => {
    return state?.form?.refs;
  });

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
    //ignore non-valid $refs for now - you will need to generate refs with them once a form is submitted

    try {
      const refs = getRefs(JSON.parse(schema));
      refs.forEach((ref) => {
        const schemaKey = ref['$ref'] as string;

        ref['$id'] = schemaKey;
        ref.type = 'string';
        const newRef = { ...ref };
        delete newRef['$ref'];

        if (!Object.keys(refDefinitions).includes(schemaKey)) {
          setExtraRefs({ ...extraRefs, [schemaKey]: newRef });
        }
      });
    } catch (e) {
      console.error(JSON.stringify(e));
    }

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
    if (Object.keys(refDefinitions).length === 0) {
      dispatch(getRefDefinitions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    Object.keys(refDefinitions).map((ref) => {
      try {
        const schemaKey = refDefinitions[ref].name as string;
        const parsedData = JSON.parse(refDefinitions[ref].refData as string);
        if (ajv.getSchema(schemaKey)) {
          // Remove the existing schema
          ajv.removeSchema(schemaKey);
        }

        ajv.addSchema(parsedData as AnySchema, schemaKey);
      } catch (e) {
        console.error(JSON.stringify(e));
      }
    });
  }, [refDefinitions]);

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

  const newRefDefinition = {};

  Object.keys(refDefinitions).map(
    (refs) => (newRefDefinition[refs] = JSON.parse(refDefinitions[refs].refData as string))
  );

  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      {display && (
        <JsonFormRegisterProvider defaultRegisters={registerData || undefined}>
          <JsonForms
            ajv={ajv}
            renderers={GoARenderers}
            cells={GoACells}
            onChange={onChange}
            data={data}
            validationMode={'ValidateAndShow'}
            //need to re-create the schemas here in order to trigger a refresh when passing data back through the context
            schema={{ ...lastGoodSchema, ...newRefDefinition, ...extraRefs }}
            uischema={{ ...lastGoodUiSchema }}
          />
        </JsonFormRegisterProvider>
      )}
    </ErrorBoundary>
  );
};
