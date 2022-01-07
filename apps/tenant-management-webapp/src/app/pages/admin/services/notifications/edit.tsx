import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton, GoADropdownOption } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { GoADropdown } from '@abgov/react-components';
import { RootState } from '@store/index';
import styled from 'styled-components';

interface NotificationTypeFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSave?: (type: NotificationItem) => void;
  title: string;
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

export const NotificationTypeModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  title,
  open,
}) => {
  const isEdit = !!initialValue;
  const [type, setType] = useState(emptyNotificationType);

  useEffect(() => {
    isEdit && setType(initialValue);
  }, [initialValue]);

  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);

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
        <GoAModalTitle>{title}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={type.name}
                data-testid="form-name"
                aria-label="name"
                onChange={(e) => setType({ ...type, name: e.target.value })}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Description</label>
              <textarea
                name="description"
                data-testid="form-description"
                value={type.description}
                aria-label="description"
                onChange={(e) => setType({ ...type, description: e.target.value })}
              />
            </GoAFormItem>
            <DropdownContainer>
              <GoAFormItem>
                <label>Select subscriber roles</label>
                <GoADropdown
                  name="subscriberRoles"
                  selectedValues={type?.subscriberRoles}
                  multiSelect={true}
                  onChange={(name, values) => {
                    if (values[values.length - 1] === 'anonymousRead') {
                      values = values.filter((value) => !realmRoles.map((realmRole) => realmRole.name).includes(value));
                    }
                    if (values.includes('anonymousRead') && values[values.length - 1] !== 'anonymousRead') {
                      values = values.filter((value) => value !== 'anonymousRead');
                    }

                    let publicSubscribe = false;

                    if (values.includes('anonymousRead')) {
                      publicSubscribe = true;
                    }

                    setType({ ...type, subscriberRoles: values, publicSubscribe });
                  }}
                >
                  {dropDownOptions.map((item) => (
                    <GoADropdownOption
                      label={item.label}
                      value={item.value}
                      key={item.key}
                      data-testid={item.dataTestId}
                    />
                  ))}
                </GoADropdown>
              </GoAFormItem>
            </DropdownContainer>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton
            disabled={!type.name}
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            onClick={(e) => onSave(type)}
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
