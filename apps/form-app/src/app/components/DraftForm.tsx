import { Renderers } from '@abgov/jsonforms-components';
import { GoABadge, GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent } from 'react';
import { Form, FormDefinition, ValidationError } from '../state';

const renderer = new Renderers();

interface DraftFormProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
  saving: boolean;
  canSubmit: boolean;
  onChange: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
  onSubmit: (form: Form) => void;
}

export const DraftForm: FunctionComponent<DraftFormProps> = ({
  definition,
  form,
  data,
  canSubmit,
  saving,
  onChange,
  onSubmit,
}) => {
  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <div className="savingIndicator" data-saving={saving}>
          <GoABadge type="information" content="Saving..." />
        </div>
        <JsonForms
          readonly={false}
          schema={definition.dataSchema}
          uischema={definition.uiSchema}
          data={data}
          validationMode="ValidateAndShow"
          renderers={renderer.GoARenderers}
          onChange={onChange}
        />
        <GoAButtonGroup alignment="end">
          <GoAButton mt="2xl" disabled={!canSubmit} type="primary" onClick={() => onSubmit(form)}>
            Submit
          </GoAButton>
        </GoAButtonGroup>
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
