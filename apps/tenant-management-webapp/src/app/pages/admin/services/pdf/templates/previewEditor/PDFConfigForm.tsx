import React from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { Grid, GridItem } from '@components/Grid';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck } from '@lib/checkInput';
import { PdfConfigFormWrapper } from './styled-components';

interface PDFConfigFormProps {
  template: PdfTemplate;
  onChange(template: PdfTemplate): void;
  setError(hasError: boolean): void;
}
export const PDFConfigForm = ({ template, onChange, setError }: PDFConfigFormProps) => {
  const { id, name, description } = template;
  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const { errors, validators } = useValidators('name', 'name', checkForBadChars, isNotEmptyCheck('name')).build();

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
            <textarea
              name="description"
              value={description}
              maxLength={512}
              data-testid="pdf-service-modal-description-textarea"
              aria-label="description"
              onChange={(e) => {
                onChange({ ...template, description: e.target.value });
              }}
            />
          </GoAFormItem>
        </Grid>
      </GoAForm>
    </PdfConfigFormWrapper>
  );
};
