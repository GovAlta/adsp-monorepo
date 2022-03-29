import React, { FunctionComponent, useEffect, useState } from 'react';
import type { ContactInformation } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import styled from 'styled-components';

import { GoAInputEmail } from '@abgov/react-components/experimental';

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

  function emailErrors(email) {
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return { email: 'You must enter a valid email' };
    }
  }

  const trySave = (contactInformation) => {
    const formErrorList = Object.assign({}, emailErrors(contactInformation.contactEmail));
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
      <GoAModal testId="notification-types-form" isOpen={open}>
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
            </ErrorWrapper>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={tryCancel}>
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
