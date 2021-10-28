import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';

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

export const NotificationTypeModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const isEdit = !!initialValue;
  const [type, setType] = useState(emptyNotificationType);

  useEffect(() => {
    isEdit && setType(initialValue);
  }, [initialValue]);

  return (
    <GoAModal testId="notification-types-form" isOpen={open}>
      <GoAModalTitle>{isEdit ? 'Edit notification type' : 'Add a notification type'}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem className={errors?.['name'] && 'error'}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={type.name}
              data-testid="form-name"
              onChange={(e) => setType({ ...type, name: e.target.value })}
            />
            <div className="error-msg">{errors?.['name']}</div>
          </GoAFormItem>
          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              data-testid="form-description"
              value={type.description}
              onChange={(e) => setType({ ...type, description: e.target.value })}
            />
          </GoAFormItem>
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
  );
};
