import { useMemo, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { getEmptyRequiredStringErrors } from '@abgov/jsonforms-components';
import { ajv } from '@lib/validation/checkInput';
import { PreviewSubmitRow } from './style-components';

interface PreviewSubmitProps {
  data: unknown;
  schema: JsonSchema;
  uiSchema: UISchemaElement;
}

// Stepper and pages forms (Categorization) render their own Submit button on the last step.
export const isSinglePageForm = (uiSchema?: UISchemaElement): boolean =>
  !!uiSchema && uiSchema.type !== 'Categorization';

// Same rule as the stepper's Submit: schema-valid, and no required string left as '' (which AJV accepts).
export const isPreviewDataValid = (schema: JsonSchema, data: unknown): boolean => {
  try {
    return ajv.validate(schema, data ?? {}) === true && getEmptyRequiredStringErrors(data ?? {}, schema).length === 0;
  } catch {
    return false;
  }
};

export const PreviewSubmit = ({ data, schema, uiSchema }: PreviewSubmitProps): JSX.Element | null => {
  const [isOpen, setIsOpen] = useState(false);
  const isValid = useMemo(() => isPreviewDataValid(schema, data), [schema, data]);

  if (!isSinglePageForm(uiSchema)) {
    return null;
  }

  return (
    <>
      <PreviewSubmitRow>
        <GoabButtonGroup alignment="end">
          <GoabButton type="primary" disabled={!isValid} onClick={() => setIsOpen(true)} testId="preview-submit-btn">
            Submit
          </GoabButton>
        </GoabButtonGroup>
      </PreviewSubmitRow>
      <GoabModal
        testId="submit-confirmation"
        open={isOpen}
        heading="Form Submitted"
        maxWidth="640px"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton type="primary" testId="close-submit-modal" onClick={() => setIsOpen(false)}>
              Close
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <b>Submit is a test for preview purposes </b>(i.e. no actual form is being submitted)
      </GoabModal>
    </>
  );
};
