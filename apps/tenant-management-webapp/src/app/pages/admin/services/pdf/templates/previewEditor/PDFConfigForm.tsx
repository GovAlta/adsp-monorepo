import React from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { Grid, GridItem } from '@components/Grid';

interface PDFConfigFormProps {
  template: PdfTemplate;
  onChange(template: PdfTemplate): void;
}
export const PDFConfigForm = ({ template, onChange }: PDFConfigFormProps) => {
  const { id, name, description } = template;
  return (
    <GoAForm>
      <Grid>
        <GridItem md={6} hSpacing={1}>
          <GoAFormItem>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              value={name}
              data-testid={`script-service-modal-name-input`}
              aria-label="name"
              onChange={(key, name) => {
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
              data-testid={`script-service-modal-template-id-input`}
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
            data-testid="script-service-modal-description-textarea"
            aria-label="description"
            onChange={(e) => {
              onChange({ ...template, description: e.target.value });
            }}
          />
        </GoAFormItem>
      </Grid>
    </GoAForm>
  );
};
