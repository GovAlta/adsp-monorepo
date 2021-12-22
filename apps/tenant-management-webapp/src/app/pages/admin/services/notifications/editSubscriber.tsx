import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import styled from 'styled-components';

interface NotificationTypeFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSave?: (type: NotificationItem) => void;
  open: boolean;

  errors?: Record<string, string>;
}

const emptyNotificationType: NotificationItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  id: null,
  publicSubscribe: false,
};

export const SubscriberModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const [subscriber, setSubscriber] = useState(emptyNotificationType);

  useEffect(() => {
    setSubscriber(initialValue);
  }, [initialValue]);

  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);

  const setSubscriberFunction = (value) => {
    const newSubscriber = subscriber;

    const emailIndex = newSubscriber.channels.findIndex((channel) => channel.channel === 'email');

    newSubscriber.channel[emailIndex] = value;

    setSubscriber(newSubscriber);
  };

  let dropDownOptions = [];

  dropDownOptions = [
    {
      value: 'anonymousRead',
      label: 'Anyone (Anonymous)',
      key: 'anonymous',
      dataTestId: 'anonymous-option',
    },
  ];

  let defaultDropDowns = [];

  if (realmRoles) {
    defaultDropDowns = realmRoles.map((realmRole) => {
      return {
        value: realmRole.name,
        label: realmRole.name,
        key: realmRole.id,
        dataTestId: `${realmRole}-update-roles-options`,
      };
    });
    dropDownOptions = dropDownOptions.concat(defaultDropDowns);
  }

  return (
    <EditStyles>
      <GoAModal testId="notification-types-form" isOpen={open}>
        <GoAModalTitle>Edit subscriber</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Address As</label>
              <input
                type="text"
                name="name"
                value={subscriber.addressAs}
                data-testid="form-name"
                aria-label="name"
                onChange={(e) => setSubscriber({ ...subscriber, addressAs: e.target.value })}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Email</label>
              <textarea
                name="email"
                data-testid="form-email"
                value={subscriber.email}
                aria-label="email"
                onChange={(e) => setSubscriberFunction(e.target.value)}
              />
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton
            disabled={!subscriber.name}
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            onClick={(e) => onSave(subscriber)}
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

const DropdownContainer = styled.div`
  margin: 0 0 200px 0;
`;
