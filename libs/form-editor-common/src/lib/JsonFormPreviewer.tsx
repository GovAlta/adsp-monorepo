import { GoARenderers, GoACells, JsonFormRegisterProvider } from '@abgov/jsonforms-components';
import { GoACallout } from '@abgov/react-components';
import { ajv } from '../components/checkInput';
import { JsonForms } from '@jsonforms/react';
import { ErrorBoundary } from 'react-error-boundary';
import FallbackRender from './FallbackRenderer';
import { FormPreviewSpacer } from './style-components';

interface JSONFormPreviewerProps {
  data: unknown;
  onChange: ({ data }: { data: unknown }) => void;
  dataSchema: any;
  uiSchema: any;
  error: any;
  registerData: any;
  nonAnonymous: any;
  dataList: any;
}

export const JSONFormPreviewer = ({
  data,
  onChange,
  dataSchema,
  uiSchema,
  error,
  registerData,
  nonAnonymous,
  dataList
}: JSONFormPreviewerProps): JSX.Element => {

  console.log(JSON.stringify(uiSchema) + "<uiSChema -----------")
  console.log(JSON.stringify(dataSchema) + '<dataSchema -----------');

  // Resolved data schema (with refs inlined) is used with JsonForms since it doesn't handle remote refs.
  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      {/* // This is a blank spacer div since web components can be problematic to apply styles to. */}
      <FormPreviewSpacer />
      {error && (
        <GoACallout type="important" size="medium" testId="form-preview-error-callout" heading={error}>
          You will see the last valid preview until the schema errors are fixed.
        </GoACallout>
      )}
      <JsonFormRegisterProvider
        defaultRegisters={{ registerData: registerData, dataList: dataList, nonAnonymous: nonAnonymous }}
      >
        <JsonForms
          // ajv={ajv}
          renderers={GoARenderers}
          cells={GoACells}
          onChange={onChange}
          data={data}
          validationMode={'ValidateAndShow'}
          //need to re-create the schemas here in order to trigger a refresh when passing data back through the context
          schema={{ ...JSON.parse(dataSchema) }}
          uischema={{ ...JSON.parse(uiSchema) }}
        />
      </JsonFormRegisterProvider>
    </ErrorBoundary>
  );
};
