import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { NotificationItem } from '@store/notification/models';
import {
  GoACheckbox,
  GoATextArea,
  GoAInput,
  GoAButton,
  GoAButtonGroup,
  GoACallout,
  GoAModal,
  GoAFormItem,
  GoARadioGroup,
  GoARadioItem,
} from '@abgov/react-components';
import { toKebabName } from '@lib/kebabName';
import { Role } from '@store/tenant/models';
import { ServiceRoleConfig } from '@store/access/models';
import { EditStyles, IdField } from './styledComponents';
import { useValidators } from '@lib/validation/useValidators';
import {
  isNotEmptyCheck,
  duplicateNameCheck,
  wordMaxLengthCheck,
  badCharsCheck,
  characterCheck,
  validationPattern,
} from '@lib/validation/checkInput';
import { RootState } from '@store/index';
import { ConfigServiceRole } from '@store/access/models';
import { ClientRoleTable } from '@components/RoleTable';
import { areObjectsEqual } from '@lib/objectUtil';
interface NotificationTypeFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSave?: (type: NotificationItem) => void;
  isNew?: boolean;
  open: boolean;
  realmRoles: Role[];
  tenantClients: ServiceRoleConfig;
}

const channels = [
  { value: 'email', title: 'Email' },
  { value: 'bot', title: 'Bot' },
  { value: 'sms', title: 'SMS' },
];

const NotificationType = {
  SUBSCRIBERS: 0,
  CONTACT: 1,
  CONTACT_EVENT_PAYLOAD: 2,
};

const NotificationTypeValue = {
  SUBSCRIBERS: 'Notify subscribers',
  CONTACT: 'Notify contact',
  CONTACT_EVENT_PAYLOAD: 'Notify contact in event payload at Json schema path',
};

export const NotificationTypeModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  isNew,
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
  const checkForContact = characterCheck(validationPattern.validContact);
  const [isNotifyAddressSetting, setIsNotifyAddressSetting] = useState(NotificationType.SUBSCRIBERS);
  const [addressPathChanged, setAddressPathChanged] = useState(false);

  useEffect(() => {
    setType(JSON.parse(JSON.stringify(initialValue)));
    setAddressPathChanged(false);
  }, [initialValue]);

  useEffect(() => {
    if (type?.addressPath && type.addressPath.length > 0) {
      setIsNotifyAddressSetting(NotificationType.CONTACT_EVENT_PAYLOAD);
    } else if (type?.address && type.address.length > 0) {
      setIsNotifyAddressSetting(NotificationType.CONTACT);
    }
  }, [type]);

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
      <ClientRoleTable
        roles={roleNames}
        clientId={clientId}
        roleSelectFunc={(roles) => {
          setType({
            ...type,
            subscriberRoles: roles,
          });
        }}
        nameColumnWidth={80}
        service="Notifications-type"
        checkedRoles={[{ title: 'subscribe', selectedRoles: type.subscriberRoles }]}
      />
    );
  };

  const handleSave = async () => {
    const validations = {
      name: type.name,
    };

    if (!isEdit) {
      validations['duplicated'] = type.name;
    }

    if (!type.channels.includes('email')) {
      type.channels = ['email', ...type.channels];
    }

    if (!validators.checkAll(validations)) {
      return;
    }

    if (isNotifyAddressSetting === NotificationType.SUBSCRIBERS) {
      type.address = null;
      type.addressPath = null;
    }

    try {
      await onSave(type);
      setAddressPathChanged(false);
    } catch (error) {
      console.error('Save failed', error);
    }
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
    .add('address', 'address', checkForContact)
    .build();
  return (
    <EditStyles>
      <GoAModal
        heading={isNew ? 'Add notification type' : 'Edit notification type'}
        testId="notification-types-form"
        open={open}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                setType(initialValue);
                validators.clear();
                setIsNotifyAddressSetting(NotificationType.SUBSCRIBERS);
                setAddressPathChanged(false);
                onCancel();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              disabled={!addressPathChanged && (validators.haveErrors() || areObjectsEqual(type, initialValue))}
              type="primary"
              testId="form-save"
              onClick={handleSave}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem error={errors?.['name']} label="Name">
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
                validators.checkAll(validations);
              }
              setType({ ...type, name: value, id: isEdit ? type.id : toKebabName(value) });
            }}
            onBlur={() => {
              if (!isEdit) {
                validators.checkAll({ name: type.name, duplicated: type.name });
              } else {
                validators.checkAll({ name: type.name });
              }
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Type ID">
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ margin: '3px 10px' }}>
              <IdField data-testid={`form-id`}>{type.id || ''}</IdField>
            </div>
          </div>
        </GoAFormItem>
        <GoAFormItem error={errors?.['description']} label="Description">
          <GoATextArea
            name="description"
            testId="form-description"
            value={type?.description}
            aria-label="description"
            width="100%"
            onKeyPress={(name, value, key) => {
              if (value) {
                validators.remove('description');
                validators['description'].check(value);
                setType({ ...type, description: value });
              }
            }}
            onChange={(name, value) => {}}
          />
        </GoAFormItem>
        {isNotifyAddressSetting === NotificationType.SUBSCRIBERS && (
          <GoAFormItem error={errors?.['channels']} label="Select Notification Channels">
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
                        testId="manage-subscriptions-checkbox"
                        value="manageSubscribe"
                        ariaLabel={`manage-subscriptions-checkbox`}
                        text={channel.title}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GoAFormItem>
        )}

        <div data-testid="manage-subscriptions-checkbox-wrapper">
          <GoAFormItem label="">
            <GoACheckbox
              name="subscribe"
              checked={!!type.manageSubscribe}
              onChange={() => {
                setType({ ...type, manageSubscribe: !type.manageSubscribe });
              }}
              testId="manage-subscriptions-checkbox"
              value="manageSubscribe"
              ariaLabel={`manage-subscriptions-checkbox`}
            >
              My subscribers are allowed to manage their own subscription for this notification type
            </GoACheckbox>
            {type.manageSubscribe && (
              <div className="fitContent">
                <GoACallout type="important">
                  This checkbox enables your subscribers to manage subscriptions on a self serve basis. Subscribers can
                  unsubscribe from the notification type without contacting the program area.
                </GoACallout>
              </div>
            )}
          </GoAFormItem>
        </div>
        <GoACheckbox
          checked={type.publicSubscribe}
          name="anonymousRead-checkbox"
          testId="anonymousRead-checkbox"
          onChange={() => {
            setType({
              ...type,
              publicSubscribe: !type.publicSubscribe,
            });
          }}
          ariaLabel={`anonymousRead-checkbox`}
          text="Make notification public"
        />

        <GoAFormItem label="Select Notify subscribers or Notify contact" error={errors?.['priority']}>
          <div style={{ marginBottom: '1rem' }}>
            <GoARadioGroup
              name="notify"
              testId="select-type-notification-radio-group"
              ariaLabel="select-type-notification-radio-group"
              value={Object.keys(NotificationType).find((key) => NotificationType[key] === isNotifyAddressSetting)} //
              onChange={(_, value) => {
                setIsNotifyAddressSetting(NotificationType[value]);
              }}
            >
              {Object.keys(NotificationType).map((label, key) => (
                <GoARadioItem key={key} name="notify" label={NotificationTypeValue[label]} value={label} />
              ))}
            </GoARadioGroup>
          </div>
        </GoAFormItem>
        {isNotifyAddressSetting === NotificationType.CONTACT && (
          <GoAFormItem label="Notify this contact" error={errors?.['address']}>
            <GoAInput
              type="text"
              name="address"
              value={type.address}
              testId={`address-notification-modal-input`}
              aria-label="input-address"
              width="60%"
              onChange={(_, value) => {
                const validations = {
                  address: value,
                };
                validators.remove('address');
                validators.checkAll(validations);
                type.address = value;
              }}
            />
          </GoAFormItem>
        )}
        {isNotifyAddressSetting === NotificationType.CONTACT_EVENT_PAYLOAD && (
          <div>
            <GoAFormItem label="Notify contact in event payload at Json schema path">
              <GoAInput
                type="text"
                name="addressPath"
                value={type.addressPath}
                testId={`address-notification-modal-input`}
                aria-label="input-path-address"
                width="60%"
                onChange={(_, value) => {
                  setType({ ...type, addressPath: value });
                  if (value !== initialValue?.addressPath) {
                    setAddressPathChanged(true);
                  }
                }}
              />
            </GoAFormItem>
            <GoAFormItem label="bcc in event payload at Json schema path">
              <GoAInput
                type="text"
                name="bcc"
                value={type.bccPath}
                testId={`address-notification-modal-input`}
                aria-label="input-path-address"
                width="60%"
                onChange={(_, value) => {
                  setType({ ...type, bccPath: value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem label="cc in event payload at Json schema path">
              <GoAInput
                type="text"
                name="cc"
                value={type.ccPath}
                testId={`address-notification-modal-input`}
                aria-label="input-path-address"
                width="60%"
                onChange={(_, value) => {
                  setType({ ...type, ccPath: value });
                }}
              />
            </GoAFormItem>
          </div>
        )}
        {tenantClients &&
          isNotifyAddressSetting === NotificationType.SUBSCRIBERS &&
          !type.publicSubscribe &&
          elements.map((e, key) => {
            return <SubscribeRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
          })}
      </GoAModal>
    </EditStyles>
  );
};
