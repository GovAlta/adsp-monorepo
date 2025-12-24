import React, { FunctionComponent, useEffect, useState } from 'react';
import styled from 'styled-components';
import type { FromEmailInformation } from '@store/notification/models';
import { GoabButton, GoabButtonGroup, GoabFormItem, GoabInput, GoabModal } from '@abgov/react-components';

import { emailError, hasMultipleEmailError } from '@lib/inputValidation';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
interface EmailNotificationTypeFormProps {
  initialValue?: FromEmailInformation;
  onCancel?: () => void;
  onSave?: (type: FromEmailInformation) => void;
  open: boolean;
  errors?: Record<string, string>;
}

export const EditEmailInformationTypeModalForm: FunctionComponent<EmailNotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const x = JSON.stringify(initialValue);
  const [formErrors, setFormErrors] = useState(null);
  const [emailInformation, setEmailInformation] = useState<FromEmailInformation>(JSON.parse(x));

  useEffect(() => {
    const x = JSON.stringify(initialValue);
    setEmailInformation(JSON.parse(x));
  }, [initialValue]);

  const tryCancel = () => {
    const x = JSON.stringify(initialValue);
    setEmailInformation(JSON.parse(x));
    setFormErrors(null);
    onCancel();
  };

  const trySave = (emailInformation: FromEmailInformation) => {
    const formErrorList = Object.assign(
      {},
      emailError(emailInformation.fromEmail),
      hasMultipleEmailError(emailInformation.fromEmail)
    );

    if (Object.keys(formErrorList).length === 0) {
      onSave(emailInformation);
      setFormErrors(null);
    } else {
      setFormErrors(formErrorList);
    }
  };

  return (
    <EditStyles>
      <GoabModal
        testId="edit-email-information-notification"
        open={open}
        heading="Edit email information"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton testId="edit-email-form-cancel" type="secondary" onClick={tryCancel}>
              Cancel
            </GoabButton>
            <GoabButton type="primary" testId="edit-email-form-save" onClick={() => trySave(emailInformation)}>
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <ErrorWrapper>
          <GoabFormItem error={formErrors?.['email']} label="Email" helpText="Email must be a real email with a inbox">
            <GoabInput
              type="email"
              name="email"
              width="100%"
              testId="edit-email-form-email"
              value={emailInformation.fromEmail}
              aria-label="email"
              onChange={(detail: GoabInputOnChangeDetail) => {
                setEmailInformation({ ...emailInformation, fromEmail: detail.value });
              }}
            />
          </GoabFormItem>
        </ErrorWrapper>
      </GoabModal>
    </EditStyles>
  );
};

const EditStyles = styled.div`
  ul {
    margin-left: 0;
  }

  li {
    border: 1px solid #f1f1f1;
  }
`;

export const ErrorWrapper = styled.div`
  .goa-state--error {
    input,
    textarea {
      border-color: var(--color-red);
    }
  }
`;
