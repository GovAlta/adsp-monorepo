import React from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { Grid, GridItem } from '@components/Grid';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { PdfConfigFormWrapper } from '../../styled-components';
import { GoATextArea } from '@abgov/react-components-new';

interface PDFConfigFormProps {
  template: PdfTemplate;
  onChange(template: PdfTemplate): void;
  setError(hasError: boolean): void;
}
export const PDFConfigForm = ({ template, onChange, setError }: PDFConfigFormProps) => {
  const { id, name, description } = template;
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  return (
    <PdfConfigFormWrapper>
      <GoAForm>
        <Grid>
          <GridItem md={6} hSpacing={1}>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <GoAInput
                type="text"
                name="name"
                value={name}
                data-testid={`pdf-service-modal-name-input`}
                aria-label="name"
                onChange={(key, name) => {
                  validators.remove('name');
                  const error = validators['name'].check(name);
                  setError(error && error.length > 0);
                  onChange({ ...template, name });
                }}
              />
            </GoAFormItem>
          </GridItem>

          <GridItem md={6}>
            <GoAFormItem>
              <label>Template ID</label>
              <GoAInput
                type="text"
                name="template-id"
                disabled={true}
                value={id}
                data-testid={`pdf-service-modal-template-id-input`}
                aria-label="template id"
                onChange={(key, id) => {
                  onChange({ ...template, id });
                }}
              />
            </GoAFormItem>
          </GridItem>
        </Grid>
        <Grid>
          <GoAFormItem>
            <label>Description</label>
            <GoATextArea
              name="description"
              value={description}
              width="100%"
              testId="pdf-service-modal-description-textarea"
              aria-label="description"
              onChange={(name, value) => {
                onChange({ ...template, description: value });
              }}
            />
          </GoAFormItem>
        </Grid>
      </GoAForm>
    </PdfConfigFormWrapper>
  );
};
