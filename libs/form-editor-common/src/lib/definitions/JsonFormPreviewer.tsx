import { GoARenderers, GoACells, JsonFormRegisterProvider } from '@abgov/jsonforms-components';
import { GoabCallout } from '@abgov/react-components';
import { ajv } from '@lib/validation/checkInput';
import { JsonForms } from '@jsonforms/react';
import { RootState } from '@store/index';
import { selectRegisterData } from '@store/configuration/selectors';
import { schemaErrorSelector } from '@store/form/selectors';
import { ErrorBoundary } from 'react-error-boundary';
import { useSelector } from 'react-redux';
import FallbackRender from './FallbackRenderer';
import { FormPreviewSpacer } from './style-components';
import { RegisterConfigData } from '../../../../jsonforms-components/src';

interface JSONFormPreviewerProps {
  data: unknown;
  onChange: ({ data }: { data: unknown }) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  preferredUsername: string;
}

export const JSONFormPreviewer = ({ data, onChange }: JSONFormPreviewerProps): JSX.Element => {
  // Resolved data schema (with refs inlined) is used with JsonForms since it doesn't handle remote refs.
  const dataSchema = useSelector((state: RootState) => state.form.editor.resolvedDataSchema);
  const uiSchema = useSelector((state: RootState) => state.form.editor.uiSchema);
  const error = useSelector(schemaErrorSelector);

  const registerData = useSelector(selectRegisterData) as RegisterConfigData[];
  const nonAnonymous = useSelector((state: RootState) => state.configuration?.nonAnonymous);
  const dataList = useSelector((state: RootState) => state.configuration?.dataList);
  const user = useSelector((state: RootState) => state.session.userInfo);

  const newUser = { ...user, roles: [], id: null } as User; // Create a new user object with the same properties as the original user, but with an empty roles array and null id

  // registerData.user = newUser;

  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      {/* // This is a blank spacer div since web components can be problematic to apply styles to. */}
      <FormPreviewSpacer />
      {error && (
        <GoabCallout type="important" size="medium" testId="form-preview-error-callout" heading={error}>
          You will see the last valid preview until the schema errors are fixed.
        </GoabCallout>
      )}
      <JsonFormRegisterProvider
        defaultRegisters={{ registerData: registerData, dataList: dataList, nonAnonymous: nonAnonymous, user: newUser }}
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
