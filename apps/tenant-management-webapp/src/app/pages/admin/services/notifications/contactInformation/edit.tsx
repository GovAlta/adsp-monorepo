import React, { FunctionComponent, useEffect, useState } from 'react';
import type { ContactInformation } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import InputMask from 'react-input-mask';

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
  const [prettyPhone, setPrettyPhone] = useState(null);

  useEffect(() => {
    const x = JSON.stringify(initialValue);
    setContactInformation(JSON.parse(x));
  }, [initialValue]);

  useEffect(() => {
    if (contactInformation) {
      setPrettyPhone('1' + contactInformation?.phoneNumber);
    }
  }, [contactInformation]);

  function emailErrors(email) {
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return { email: 'You must enter a valid email' };
    }
  }

  function phoneError(phone) {
    if (!/^\d{10}$/.test(phone) && phone.length !== 0) {
      return { phoneNumber: 'Please enter a valid phone number ie. 1 (780) 123-4567' };
    }
  }

  const trySave = (contactInformation) => {
    const formErrorList = Object.assign(
      {},
      emailErrors(contactInformation.contactEmail),
      phoneError(prettyPhone.replace(/[- )(]/g, '').slice(1))
    );
    if (Object.keys(formErrorList).length === 0) {
      if (contactInformation.phoneNumber) {
        const cleanNumber = prettyPhone.replace(/[- )(]/g, '').slice(1);
        contactInformation.phoneNumber = cleanNumber;
      }
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
              <GoAFormItem error={formErrors?.['phoneNumber']}>
                <label>
                  Phone number <em>optional</em>
                </label>
                <InputMask
                  name="phoneNumber"
                  value={prettyPhone}
                  placeholder="1 (780) 123-4567"
                  mask="1\ (999) 999-9999"
                  maskChar=" "
                  data-testid="form-phone-number"
                  aria-label="name"
                  onChange={(e) => {
                    setPrettyPhone(e.target.value);
                  }}
                />
              </GoAFormItem>
              <GoAFormItem error={formErrors?.['supportInstructions']}>
                <label>Support instructions</label>
                <textarea
                  rows={7}
                  name="supportInstruction"
                  value={contactInformation?.supportInstructions || ''}
                  data-testid="form-support-instructions"
                  aria-label="name"
                  onChange={(e) =>
                    setContactInformation({ ...contactInformation, supportInstructions: e.target.value })
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
