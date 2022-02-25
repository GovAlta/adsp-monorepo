import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import { GoACallout } from '@abgov/react-components';
import styled from 'styled-components';
import { GoACheckbox } from '@abgov/react-components';

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
  manageSubscribe: false,
  customized: false,
};

export const CoreNotificationTypeModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  title,
  open,
}) => {
  //const dispatch = useDispatch();
  const isEdit = !!initialValue;
  const [type, setType] = useState(emptyNotificationType);

  useEffect(() => {
    isEdit && setType(initialValue);
  }, [initialValue]);

  return (
    <EditStyles>
      <GoAModal testId="notification-types-form" isOpen={open}>
        <GoAModalTitle>{title}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem>
              <GoACheckbox
                name="subscribe"
                checked={!!type.manageSubscribe}
                onChange={() => {
                  setType({ ...type, manageSubscribe: !type.manageSubscribe });
                }}
                value="manageSubscribe"
              >
                My subscribers are allowed to manage their own subscription for this notification type
              </GoACheckbox>
              {type.manageSubscribe && (
                <GoACallout type="important">
                  This checkbox enables your subscribers to manage subscriptions on a self serve basis. Subscribers can
                  unsubscribe from the notification type without contacting the program area.
                </GoACallout>
              )}
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
