import React, { FunctionComponent, useEffect, useState } from 'react';
import type { ContactInformation } from '@store/notification/models';
import { GoAButton, GoAButtonGroup, GoAInput, GoAModal, GoAFormItem } from '@abgov/react-components';
import styled from 'styled-components';
import { emailError } from '@lib/inputValidation';

interface EditContactInformationFormProps {
  initialValue?: ContactInformation;
  onCancel?: () => void;
  onSave?: (type: ContactInformation) => void;
  open: boolean;
  errors?: Record<string, string>;
}

export const ContactInformationModalForm: FunctionComponent<EditContactInformationFormProps> = ({
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
    const formErrorList = Object.assign({}, emailError(contactInformation.contactEmail));
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
      <GoAModal
        testId="edit-contact-information-status"
        open={open}
        heading="Edit contact information"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton testId="form-cancel" type="secondary" onClick={tryCancel}>
              Cancel
            </GoAButton>
            <GoAButton type="primary" testId="form-save" onClick={() => trySave(contactInformation)}>
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <ErrorWrapper>
          <GoAFormItem error={formErrors?.['email']} label="Email">
            <GoAInput
              type="email"
              width="100%"
              name="email"
              testId="form-email"
              value={contactInformation?.contactEmail || ''}
              aria-label="email"
              onChange={(_, value) => {
                setContactInformation({ ...contactInformation, contactEmail: value });
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
