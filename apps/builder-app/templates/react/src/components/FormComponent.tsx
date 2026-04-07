import {
  ContextProviderFactory,
  GoARenderers,
  GoAReviewRenderers,
  JsonFormRegisterProvider,
} from '@abgov/jsonforms-components';
import type { JsonFormsCore } from '@jsonforms/core';
import { JsonForms, type JsonFormsInitStateProps } from '@jsonforms/react';
import { type FunctionComponent } from 'react';

const ContextProvider = ContextProviderFactory();

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
