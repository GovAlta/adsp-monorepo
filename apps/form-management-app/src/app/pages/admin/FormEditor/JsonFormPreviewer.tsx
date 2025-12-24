import { GoARenderers, GoACells, JsonFormRegisterProvider } from '@abgov/jsonforms-components';
import styles from './Editor.module.scss';
import { GoabCallout } from '@abgov/react-components';
import { ajv } from '../../../utils/checkInput';
import { JsonForms } from '@jsonforms/react';
import { ErrorBoundary } from 'react-error-boundary';
import FallbackRender from './FallbackRenderer';
import { UISchemaElement } from '@jsonforms/core';
import { JsonSchema } from '@jsonforms/core';
import { RegisterData } from '../../../../../../../libs/jsonforms-components/src';

interface JSONFormPreviewerProps {
  data: unknown;
  onChange: ({ data }: { data: unknown }) => void;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  error: string | null;
  registerData: RegisterData;
  nonAnonymous: string[];
  dataList: string[];
}

export const JSONFormPreviewer = ({
  data,
  onChange,
  dataSchema,
  uiSchema,
  error,
  registerData,
  nonAnonymous,
  dataList,
}: JSONFormPreviewerProps): JSX.Element => {
  // Resolved data schema (with refs inlined) is used with JsonForms since it doesn't handle remote refs.

  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      {/* // This is a blank spacer div since web components can be problematic to apply styles to. */}
      <div className={styles['form-preview-spacer']} />
      {error && (
        <GoabCallout type="important" size="medium" testId="form-preview-error-callout" heading={error}>
          You will see the last valid preview until the schema errors are fixed.
        </GoabCallout>
      )}
      <JsonFormRegisterProvider
        defaultRegisters={{ registerData: registerData, dataList: dataList, nonAnonymous: nonAnonymous }}
      >
        <JsonForms
          ajv={ajv}
          renderers={GoARenderers}
          cells={GoACells}
          onChange={onChange}
          data={data}
          validationMode={'ValidateAndShow'}
          //need to re-create the schemas here in order to trigger a refresh when passing data back through the context
          schema={{ ...dataSchema }}
          uischema={{ ...uiSchema }}
        />
      </JsonFormRegisterProvider>
    </ErrorBoundary>
  );
};
