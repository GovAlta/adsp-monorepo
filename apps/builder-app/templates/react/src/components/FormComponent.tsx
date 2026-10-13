import {
  ContextProviderFactory,
  createDefaultAjv,
  GoARenderers,
  GoAReviewRenderers,
  JsonFormRegisterProvider,
} from '@abgov/jsonforms-components';
import { commonV1JsonSchema, standardV1JsonSchema } from '@abgov/data-exchange-standard';
import type { JsonFormsCore } from '@jsonforms/core';
import { JsonForms, type JsonFormsInitStateProps } from '@jsonforms/react';
import { type FunctionComponent } from 'react';

const ContextProvider = ContextProviderFactory();

// Registers the ADSP standard and common schemas so a $ref such as
// https://adsp.alberta.ca/common.v1.schema.json#/definitions/email resolves. JsonForms recompiles the schema when the
// ajv instance changes, so keep a single module-level instance.
const formAjv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

interface FormComponentProps extends Omit<JsonFormsInitStateProps, 'data' | 'renderers'> {
  data?: Record<string, unknown>;
  readonly?: boolean;
  onChange: (state: Partial<Pick<JsonFormsCore, 'data' | 'errors'>>) => void;
}

export const FormComponent: FunctionComponent<FormComponentProps> = ({
  data,
  readonly,
  onChange,
  ...props
}) => {
  return (
    <ContextProvider>
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <JsonForms
          ajv={formAjv}
          {...props}
          readonly={readonly}
          data={data}
          renderers={(readonly ? GoAReviewRenderers : GoARenderers) as never}
          onChange={(state) => onChange(state)}
        />
      </JsonFormRegisterProvider>
    </ContextProvider>
  );
};
