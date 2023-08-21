import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { NotificationItem } from '@store/notification/models';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { GoACallout } from '@abgov/react-components';
import styled from 'styled-components';
import { GoACheckbox, GoATextArea, GoAInput, GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { toKebabName } from '@lib/kebabName';
import { Role } from '@store/tenant/models';
import { ServiceRoleConfig } from '@store/access/models';
import { AnonymousWrapper } from './styledComponents';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { RootState } from '@store/index';
import { ConfigServiceRole } from '@store/access/models';
import { ClientRoleTable } from '@components/RoleTable';
interface NotificationTypeFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSave?: (type: NotificationItem) => void;
  title: string;
  open: boolean;
  realmRoles: Role[];
  tenantClients: ServiceRoleConfig;
}

const channels = [
  { value: 'email', title: 'Email' },
  { value: 'bot', title: 'Bot' },
  { value: 'sms', title: 'SMS' },
];

const IdField = styled.div`
  min-height: 1.6rem;
`;

export const NotificationTypeModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  title,
  open,
  realmRoles,
  tenantClients,
}) => {
  const isEdit = !!initialValue?.id;
  const [type, setType] = useState(initialValue);
  const notificationTypes = useSelector((state: RootState) => state.notification.notificationTypes);
  const core = useSelector((state: RootState) => state.notification.core);
  const typeObjects = Object.values({ ...notificationTypes, ...core });
  const typeNames = typeObjects.map((type: NotificationItem) => type.name);
  useEffect(() => {
    setType(JSON.parse(JSON.stringify(initialValue)));
  }, [initialValue]);

  const roleNames = realmRoles
    ? realmRoles.map((role) => {
        return role.name;
      })
    : [];

  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    tenantClients &&
    Object.entries(tenantClients).length > 0 &&
    Object.entries(tenantClients)
      .filter(([clientId, config]) => {
        return (config as ConfigServiceRole).roles.length > 0;
      })
      .map(([clientId, config]) => {
        const roles = (config as ConfigServiceRole).roles;
        const roleNames = roles.map((role) => {
          return role.role;
        });
        return { roleNames: roleNames, clientId: clientId, currentElements: null };
      });
  elements = elements.concat(clientElements);

  const SubscribeRole = ({ roleNames, clientId }) => {
    return (
      <>
        <ClientRoleTable
          roles={roleNames}
          clientId={clientId}
          roleSelectFunc={(roles) => {
            setType({
              ...type,
              subscriberRoles: roles,
            });
          }}
          service="Notifications-type"
          checkedRoles={[{ title: 'subscribe', selectedRoles: type.subscriberRoles }]}
        />
      </>
    );
  };

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(typeNames, 'Notification type'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  return (
    <EditStyles>
      <GoAModal testId="notification-types-form" isOpen={open}>
        <GoAModalTitle>{title}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <GoAInput
                type="text"
                name="name"
                value={type.name}
                testId="form-name"
                aria-label="name"
                width="100%"
                onChange={(name, value) => {
                  const validations = {
                    name: value,
                  };
                  if (!isEdit) {
                    validators.remove('name');
                    validations['duplicated'] = value;
                    validators.checkAll(validations);
                  }
                  setType({ ...type, name: value, id: isEdit ? type.id : toKebabName(value) });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <label>Type ID</label>

                <div style={{ margin: '3px 10px' }}>
                  <IdField data-testid={`form-id`}>{type.id || ''}</IdField>
                </div>
              </div>
            </GoAFormItem>
            <GoAFormItem error={errors?.['description']}>
              <label>Description</label>
              <GoATextArea
                name="description"
                testId="form-description"
                value={type.description}
                aria-label="description"
                width="100%"
                onChange={(name, value) => {
                  const description = value;
                  validators.remove('description');
                  validators['description'].check(description);
                  setType({ ...type, description: description });
                }}
              />
            </GoAFormItem>
            <GoAFormItem error={errors?.['channels']}>
              <label>Select Notification Channels</label>
              <div key="select channel" style={{ display: 'flex', flexDirection: 'row' }}>
                {channels.map((channel, key) => {
                  return (
                    <div key={key}>
                      <div style={{ paddingRight: '20px' }}>
                        <GoACheckbox
                          name={channel.value}
                          checked={
                            type.channels?.map((value) => value).includes(channel.value) || channel.value === 'email'
                          }
                          disabled={channel.value === 'email'}
                          onChange={() => {
                            const channels = type.channels || ['email'];
                            const checked = channels.findIndex((ch) => ch === channel.value);
                            if (checked === -1) {
                              channels.push(channel.value);
                            } else {
                              channels.splice(checked, 1);
                            }

                            setType({ ...type, channels: channels });
                          }}
                          data-testid="manage-subscriptions-checkbox"
                          value="manageSubscribe"
                          ariaLabel={`manage-subscriptions-checkbox`}
                        >
                          {channel.title}
                        </GoACheckbox>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GoAFormItem>
            <div data-testid="manage-subscriptions-checkbox-wrapper">
              <GoAFormItem>
                <GoACheckbox
                  name="subscribe"
                  checked={!!type.manageSubscribe}
                  onChange={() => {
                    setType({ ...type, manageSubscribe: !type.manageSubscribe });
                  }}
                  data-testid="manage-subscriptions-checkbox"
                  value="manageSubscribe"
                  ariaLabel={`manage-subscriptions-checkbox`}
                >
                  My subscribers are allowed to manage their own subscription for this notification type
                </GoACheckbox>
                {type.manageSubscribe && (
                  <div className="fitContent">
                    <GoACallout type="important">
                      This checkbox enables your subscribers to manage subscriptions on a self serve basis. Subscribers
                      can unsubscribe from the notification type without contacting the program area.
                    </GoACallout>
                  </div>
                )}
              </GoAFormItem>
            </div>
            <AnonymousWrapper>
              <GoACheckbox
                checked={type.publicSubscribe}
                name="anonymousRead-checkbox"
                data-testid="anonymousRead-checkbox"
                onChange={() => {
                  setType({
                    ...type,
                    publicSubscribe: !type.publicSubscribe,
                  });
                }}
                ariaLabel={`anonymousRead-checkbox`}
              />
              Make notification public
            </AnonymousWrapper>
            {tenantClients &&
              !type.publicSubscribe &&
              elements.map((e, key) => {
                return <SubscribeRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
              })}
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                setType(initialValue);
                validators.clear();
                onCancel();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              disabled={validators.haveErrors()}
              type="primary"
              testId="form-save"
              onClick={() => {
                const validations = {
                  name: type.name,
                };
                if (!isEdit) {
                  validations['duplicated'] = type.name;
                }
                if (!type.channels.includes('email')) {
                  // Must include email as first channel
                  type.channels = ['email', ...type.channels];
                }
                if (!validators.checkAll(validations)) {
                  return;
                }
                onSave(type);
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
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

  .fitContent {
    max-width: fit-content;
    min-height: 146px;
  }

  .messages {
    margin-top: 0;
  }

  h3 {
    margin-bottom: 0;
  }
  width: 36em;
`;
