import React, { FunctionComponent, useEffect, useState } from 'react';
import styled from 'styled-components';
import type { FromEmailInformation } from '@store/notification/models';
import { GoAButton, GoAButtonGroup, GoAFormItem, GoAInput, GoAModal } from '@abgov/react-components-new';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { emailError, hasMultipleEmailError } from '@lib/inputValidation';

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
  const [formErrors, setFormErrors] = useState(null);
  const [emailInformation, setEmailInformation] = useState<FromEmailInformation>(initialValue);
  const fromEmail = useSelector((state: RootState) => state.notification.email);
  const tryCancel = () => {
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
      <GoAModal
        testId="edit-email-information-notification"
        open={open}
        heading="Edit email information"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton testId="edit-email-form-cancel" type="secondary" onClick={tryCancel}>
              Cancel
            </GoAButton>
            <GoAButton type="primary" testId="edit-email-form-save" onClick={() => trySave(emailInformation)}>
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <ErrorWrapper>
          <GoAFormItem error={formErrors?.['email']} label="Email" helpText="Email must be a real email with a inbox">
            <GoAInput
              type="email"
              name="email"
              width="100%"
              testId="edit-email-form-email"
              value={fromEmail?.fromEmail}
              aria-label="email"
              onChange={(_, value) => {
                setEmailInformation({ ...emailInformation, fromEmail: value });
              }}
            />
          </GoAFormItem>
        </ErrorWrapper>
      </GoAModal>
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
