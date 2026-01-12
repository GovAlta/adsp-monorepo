import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { NotificationItem } from '@store/notification/models';
import {
  GoabCheckbox,
  GoabTextArea,
  GoabInput,
  GoabButton,
  GoabButtonGroup,
  GoabCallout,
  GoabModal,
  GoabFormItem,
  GoabRadioGroup,
  GoabRadioItem,
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
import { HelpTextComponent } from '@components/HelpTextComponent';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabRadioGroupOnChangeDetail,
} from '@abgov/ui-components-common';

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
  const descErrMessage = 'Notification type description can not be over 180 characters';
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
      <GoabModal
        heading={isNew ? 'Add notification type' : 'Edit notification type'}
        testId="notification-types-form"
        open={open}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
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
            </GoabButton>
            <GoabButton
              disabled={!addressPathChanged && (validators.haveErrors() || areObjectsEqual(type, initialValue))}
              type="primary"
              testId="form-save"
              onClick={handleSave}
            >
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem error={errors?.['name']} label="Name">
          <GoabInput
            type="text"
            name="name"
            value={type.name}
            testId="form-name"
            aria-label="name"
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => {
              const validations = {
                name: detail.value,
              };
              if (!isEdit) {
                validators.remove('name');
                validators.checkAll(validations);
              }
              setType({ ...type, name: detail.value, id: isEdit ? type.id : toKebabName(detail.value) });
            }}
            onBlur={() => {
              if (!isEdit) {
                validators.checkAll({ name: type.name, duplicated: type.name });
              } else {
                validators.checkAll({ name: type.name });
              }
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="Type ID">
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ margin: '3px 10px' }}>
              <IdField data-testid={`form-id`}>{type.id || ''}</IdField>
            </div>
          </div>
        </GoabFormItem>
        <GoabFormItem error={errors?.['description']} label="Description">
          <GoabTextArea
            name="description"
            testId="form-description"
            value={type?.description}
            aria-label="description"
            width="100%"
            onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
              if (detail.value) {
                validators.remove('description');
                validators['description'].check(detail.value);
                setType({ ...type, description: detail.value });
              }
            }}
            onChange={() => {}}
          />
          <HelpTextComponent
            length={type?.description?.length || 0}
            maxLength={180}
            descErrMessage={descErrMessage}
            errorMsg={errors?.['description']}
          />
        </GoabFormItem>
        {isNotifyAddressSetting === NotificationType.SUBSCRIBERS && (
          <GoabFormItem error={errors?.['channels']} label="Select Notification Channels">
            <div key="select channel" style={{ display: 'flex', flexDirection: 'row' }}>
              {channels.map((channel, key) => {
                return (
                  <div key={key}>
                    <div style={{ paddingRight: '20px' }}>
                      <GoabCheckbox
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
          </GoabFormItem>
        )}

        <div data-testid="manage-subscriptions-checkbox-wrapper">
          <GoabFormItem label="">
            <GoabCheckbox
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
            </GoabCheckbox>
            {type.manageSubscribe && (
              <div className="fitContent">
                <GoabCallout type="important">
                  This checkbox enables your subscribers to manage subscriptions on a self serve basis. Subscribers can
                  unsubscribe from the notification type without contacting the program area.
                </GoabCallout>
              </div>
            )}
          </GoabFormItem>
        </div>
        <GoabCheckbox
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

        <GoabFormItem label="Select Notify subscribers or Notify contact" error={errors?.['priority']}>
          <div style={{ marginBottom: '1rem' }}>
            <GoabRadioGroup
              name="notify"
              testId="select-type-notification-radio-group"
              ariaLabel="select-type-notification-radio-group"
              value={Object.keys(NotificationType).find((key) => NotificationType[key] === isNotifyAddressSetting)} //
              onChange={(detail: GoabRadioGroupOnChangeDetail) => {
                setIsNotifyAddressSetting(NotificationType[detail.value]);
              }}
            >
              {Object.keys(NotificationType).map((label, key) => (
                <GoabRadioItem key={key} name="notify" label={NotificationTypeValue[label]} value={label} />
              ))}
            </GoabRadioGroup>
          </div>
        </GoabFormItem>
        {isNotifyAddressSetting === NotificationType.CONTACT && (
          <GoabFormItem label="Notify this contact" error={errors?.['address']}>
            <GoabInput
              type="text"
              name="address"
              value={type.address}
              testId={`address-notification-modal-input`}
              aria-label="input-address"
              width="60%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                const validations = {
                  address: detail.value,
                };
                validators.remove('address');
                validators.checkAll(validations);
                type.address = detail.value;
              }}
            />
          </GoabFormItem>
        )}
        {isNotifyAddressSetting === NotificationType.CONTACT_EVENT_PAYLOAD && (
          <div>
            <GoabFormItem label="Notify contact in event payload at Json schema path">
              <GoabInput
                type="text"
                name="addressPath"
                value={type.addressPath}
                testId={`address-notification-modal-input`}
                aria-label="input-path-address"
                width="60%"
                onChange={(detail: GoabInputOnChangeDetail) => {
                  setType({ ...type, addressPath: detail.value });
                  if (detail.value !== initialValue?.addressPath) {
                    setAddressPathChanged(true);
                  }
                }}
              />
            </GoabFormItem>
            <GoabFormItem label="bcc in event payload at Json schema path">
              <GoabInput
                type="text"
                name="bcc"
                value={type.bccPath}
                testId={`bccPath-notification-modal-input`}
                aria-label="input-path-address"
                width="60%"
                onChange={(detail: GoabInputOnChangeDetail) => {
                  setType({ ...type, bccPath: detail.value });
                }}
              />
            </GoabFormItem>
            <GoabFormItem label="cc in event payload at Json schema path">
              <GoabInput
                type="text"
                name="cc"
                value={type.ccPath}
                testId={`ccPath-notification-modal-input`}
                aria-label="input-path-address"
                width="60%"
                onChange={(detail: GoabInputOnChangeDetail) => {
                  setType({ ...type, ccPath: detail.value });
                }}
              />
            </GoabFormItem>
            <GoabFormItem label="attachment in event payload at Json schema path">
              <GoabInput
                type="text"
                name="attachment"
                value={type.attachmentPath}
                testId={`attachmentPath-notification-modal-input`}
                aria-label="input-path-address"
                width="60%"
                onChange={(detail: GoabInputOnChangeDetail) => {
                  setType({ ...type, attachmentPath: detail.value });
                }}
              />
            </GoabFormItem>
          </div>
        )}
        {tenantClients &&
          isNotifyAddressSetting === NotificationType.SUBSCRIBERS &&
          !type.publicSubscribe &&
          elements.map((e, key) => {
            return <SubscribeRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
          })}
      </GoabModal>
    </EditStyles>
  );
};
