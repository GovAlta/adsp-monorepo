import React, { FunctionComponent, useEffect, useState } from 'react';
import type { ContactInformation } from '@store/notification/models';
import { GoabButton, GoabButtonGroup, GoabInput, GoabModal, GoabFormItem } from '@abgov/react-components';
import styled from 'styled-components';
import { emailError } from '@lib/inputValidation';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
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
      <GoabModal
        testId="edit-contact-information-status"
        open={open}
        heading="Edit contact information"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton testId="form-cancel" type="secondary" onClick={tryCancel}>
              Cancel
            </GoabButton>
            <GoabButton type="primary" testId="form-save" onClick={() => trySave(contactInformation)}>
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <ErrorWrapper>
          <GoabFormItem error={formErrors?.['email']} label="Email">
            <GoabInput
              type="email"
              width="100%"
              name="email"
              testId="form-email"
              value={contactInformation?.contactEmail || ''}
              aria-label="email"
              onChange={(detail: GoabInputOnChangeDetail) => {
                setContactInformation({ ...contactInformation, contactEmail: detail.value });
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
