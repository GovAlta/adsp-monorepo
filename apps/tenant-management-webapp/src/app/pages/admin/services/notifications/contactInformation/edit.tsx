import React, { FunctionComponent, useEffect, useState } from 'react';
import type { ContactInformation } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import { GoATextArea } from '@abgov/react-components-new';
import { GoAInputEmail } from '@abgov/react-components/experimental';
import { isSmsValid, emailError, smsError } from '@lib/inputValidation';

interface NotificationTypeFormProps {
  initialValue?: ContactInformation;
  onCancel?: () => void;
  onSave?: (type: ContactInformation) => void;
  open: boolean;
  errors?: Record<string, string>;
}

export const ContactInformationModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const x = JSON.stringify(initialValue);
  const [contactInformation, setContactInformation] = useState<ContactInformation>(JSON.parse(x));
  const [formErrors, setFormErrors] = useState(null);

  useEffect(() => {
    const x = JSON.stringify(initialValue);
    setContactInformation(JSON.parse(x));
  }, [initialValue]);

  const trySave = (contactInformation) => {
    const formErrorList = Object.assign(
      {},
      emailError(contactInformation.contactEmail),
      smsError(contactInformation.phoneNumber)
    );
    if (Object.keys(formErrorList).length === 0) {
      onSave(contactInformation);
      setFormErrors(null);
    } else {
      setFormErrors(formErrorList);
    }
  };

  const tryCancel = () => {
    const x = JSON.stringify(initialValue);
    setContactInformation(JSON.parse(x));
    setFormErrors(null);
    onCancel();
  };

  return (
    <EditStyles>
      <GoAModal testId="edit-contact-information-notification" isOpen={open}>
        <GoAModalTitle>Edit contact information</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <ErrorWrapper>
              <GoAFormItem error={formErrors?.['email']}>
                <label>Email</label>
                <GoAInputEmail
                  name="email"
                  data-testid="form-email"
                  value={contactInformation?.contactEmail || ''}
                  aria-label="email"
                  onChange={(_, value) => {
                    setContactInformation({ ...contactInformation, contactEmail: value });
                  }}
                />
              </GoAFormItem>
              <GoAFormItem error={formErrors?.['sms']}>
                <label>
                  Phone number <em>optional</em>
                </label>
                <GoAInput
                  type="text"
                  aria-label="sms"
                  name="sms"
                  value={contactInformation?.phoneNumber || ''}
                  data-testid="contact-sms-input"
                  onChange={(_, value) => {
                    if (isSmsValid(value)) {
                      setContactInformation({ ...contactInformation, phoneNumber: value.substring(0, 10) });
                    }
                  }}
                  trailingIcon="close"
                  onTrailingIconClick={() => {
                    setContactInformation({ ...contactInformation, phoneNumber: '' });
                  }}
                />
              </GoAFormItem>
              <GoAFormItem error={formErrors?.['supportInstructions']}>
                <label>Support instructions</label>
                <GoATextArea
                  rows={7}
                  name="supportInstruction"
                  value={contactInformation?.supportInstructions || ''}
                  testId="form-support-instructions"
                  aria-label="name"
                  width="100%"
                  onChange={(name, value) =>
                    setContactInformation({ ...contactInformation, supportInstructions: value })
                  }
                />
              </GoAFormItem>
            </ErrorWrapper>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel" buttonType="secondary" type="button" onClick={tryCancel}>
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            onClick={(e) => trySave(contactInformation)}
          >
            Save
          </GoAButton>
        </GoAModalActions>
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
