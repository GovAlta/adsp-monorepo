import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';

interface NotificationDefinitionFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSave?: (definition: NotificationItem) => void;
  open: boolean;

  errors?: Record<string, string>;
}

const emptyNotificationDefinition: NotificationItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  id: null,
  publicSubscribe: false,
};

export const NotificationDefinitionModalForm: FunctionComponent<NotificationDefinitionFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const isEdit = !!initialValue;
  const [definition, setDefinition] = useState(emptyNotificationDefinition);

  useEffect(() => {
    isEdit && setDefinition(initialValue);
  }, [initialValue]);

  return (
    <GoAModal testId="notification-types-form" isOpen={open}>
      <GoAModalTitle>{isEdit ? 'Edit Definition' : 'Add a notification type'}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem className={errors?.['name'] && 'error'}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={definition.name}
              data-testid="form-name"
              onChange={(e) => setDefinition({ ...definition, name: e.target.value })}
            />
            <div className="error-msg">{errors?.['name']}</div>
          </GoAFormItem>
          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              data-testid="form-description"
              value={definition.description}
              onChange={(e) => setDefinition({ ...definition, description: e.target.value })}
            />
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          Cancel
        </GoAButton>
        <GoAButton
          disabled={!definition.description || !definition.name}
          buttonType="primary"
          data-testid="form-save"
          type="submit"
          onClick={(e) => onSave(definition)}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
