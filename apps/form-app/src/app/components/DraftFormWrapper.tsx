import { ContextProviderFactory } from '@abgov/jsonforms-components';
import { GoAButton, GoAButtonGroup, GoACallout } from '@abgov/react-components';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { DateTime } from 'luxon';
import { FunctionComponent } from 'react';
import { Form, FormDefinition, ValidationError } from '../state';
import { DraftForm } from './DraftForm';

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
  onSave?: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
}

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
  onSave,
}) => {
  const handleMouseEnter = () => {
    const focusedElement = document.activeElement as HTMLElement | null;
    focusedElement.blur();
  };

  const ButtonGroup = ({ showSubmit, canSubmit, onSubmit, form }): JSX.Element => {
    return (
      <GoAButtonGroup alignment="end">
        {showSubmit && (
          <div onMouseEnter={handleMouseEnter}>
            <GoAButton
              mt="s"
              mb="3xl"
              disabled={!canSubmit}
              type="submit"
              data-testid="form-submit"
              onClick={() => {
                onSubmit(form);
              }}
            >
              Submit
            </GoAButton>
          </div>
        )}
      </GoAButtonGroup>
    );
  };

  const daysTilIntakeEnd =
    definition?.intake?.end && Math.round(definition.intake.end?.diff(DateTime.now()).as('days'));

  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        {daysTilIntakeEnd <= 5 && (
          <GoACallout type="information" heading="Intake closing soon">
            Intake is closing in {daysTilIntakeEnd} days. Please complete and submit your form before{' '}
            {definition.intake.end.toFormat('LLLL d, yyyy')} to apply.
          </GoACallout>
        )}
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
          onSave={onSave}
        />
        <ButtonGroup showSubmit={showSubmit} canSubmit={canSubmit} onSubmit={onSubmit} form={form} />
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
