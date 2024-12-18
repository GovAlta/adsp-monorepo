import { ContextProviderFactory } from '@abgov/jsonforms-components';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { FunctionComponent } from 'react';
import { Form, FormDefinition, ValidationError } from '../state';
import { DraftForm } from './DraftForm';
import Ajv from 'ajv';

export const ContextProvider = ContextProviderFactory();

export type JsonSchema = JsonSchema4 | JsonSchema7;
interface DraftFormProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
  canSubmit: boolean;
  showSubmit: boolean;
  saving: boolean;
  submitting: boolean;
  anonymousApply?: boolean;
  onChange: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
  onSubmit: (form: Form) => void;
  ajv: Ajv;
}

const unfilledRequiredRecursive = (schema, data) => {
  const currentUnfilledRequired =
    (schema?.required || []).filter((requiredItem) => {
      return Object.keys(data).find((key) => key === requiredItem && (data[key] as string).length === 0);
    }).length > 0;

  const subsetRequired =
    Object.keys(schema?.properties || []).filter((prop) => {
      return schema?.properties && unfilledRequiredRecursive(schema?.properties[prop], data[prop] || {});
    }).length > 0;

  return currentUnfilledRequired || subsetRequired;
};

export const populateDropdown = (schema, enumerators) => {
  const newSchema = JSON.parse(JSON.stringify(schema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '') {
      property[propertyName].enum = enumerators?.getFormContextData(propertyName) as string[];
    }
  });

  return newSchema as JsonSchema;
};

export const DraftFormWrapper: FunctionComponent<DraftFormProps> = ({
  definition,
  form,
  data,
  anonymousApply,
  canSubmit,
  showSubmit,
  saving,
  submitting,
  onChange,
  onSubmit,
}) => {
  const unfilledRequired = unfilledRequiredRecursive(definition.dataSchema, data);

  const ButtonGroup = ({ showSubmit, canSubmit, onSubmit, form }): JSX.Element => {
    return (
      <GoAButtonGroup alignment="end">
        {showSubmit && (
          <GoAButton
            mt="s"
            mb="3xl"
            disabled={!canSubmit || unfilledRequired}
            type="primary"
            data-testid="form-submit"
            onClick={() => {
              onSubmit(form);
            }}
          >
            Submit
          </GoAButton>
        )}
      </GoAButtonGroup>
    );
  };

  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <DraftForm
          definition={definition}
          form={form}
          data={data}
          anonymousApply={anonymousApply}
          canSubmit={canSubmit}
          showSubmit={showSubmit}
          saving={saving}
          submitting={submitting}
          onChange={onChange}
          onSubmit={onSubmit}
        />
        <ButtonGroup showSubmit={showSubmit} canSubmit={canSubmit} onSubmit={onSubmit} form={form} />
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
