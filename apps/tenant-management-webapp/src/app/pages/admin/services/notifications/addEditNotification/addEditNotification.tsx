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
} from '@abgov/react-components-new';
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
  const checkForEmail = characterCheck(validationPattern.validEmail);
  const [isNotifyAddress, setIsNotifyAddress] = useState(false);
  const [addressPathChanged, setAddressPathChanged] = useState(false);

  useEffect(() => {
    setType(JSON.parse(JSON.stringify(initialValue)));
    setAddressPathChanged(false);
  }, [initialValue]);

  useEffect(() => {
    setIsNotifyAddress(
      (type?.address && type.address.length > 0) || (type?.addressPath && type.addressPath.length > 0)
    );
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
    // if (!isEdit) {
    //   validations['duplicated'] = type.name;
    // }

    if (!type.channels.includes('email')) {
      type.channels = ['email', ...type.channels];
    }

    if (!validators.checkAll(validations)) {
      return;
    }

    if (!isNotifyAddress) {
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
    .add('address', 'address', checkForEmail)
    .build();

  return (
    <EditStyles>
      <GoAModal
        testId="notification-types-form"
        open={open}
        heading={title}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                setType(initialValue);
                validators.clear();
                setIsNotifyAddress(false);
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
                // validations['duplicated'] = value;
                validators.checkAll(validations);
              }
              setType({ ...type, name: value, id: isEdit ? type.id : toKebabName(value) });
            }}
            onBlur={() => {
              validators.checkAll({
                name: type.name,
                // duplicated: type.name
              });
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
            // eslint-disable-next-line
            onChange={(name, value) => {}}
          />
        </GoAFormItem>
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
                      disabled={isNotifyAddress || channel.value === 'email'}
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

        <GoAFormItem label="Select Notify subscribers or Notify address" error={errors?.['priority']}>
          <GoARadioGroup
            name="notify"
            testId="select-type-notification-radio-group"
            ariaLabel="select-type-notification-radio-group"
            value={isNotifyAddress ? 'Notify address' : 'Notify subscribers'}
            onChange={(_, value) => {
              setIsNotifyAddress(!isNotifyAddress);
            }}
          >
            <GoARadioItem name="notify" value="Notify subscribers" />
            <GoARadioItem name="notify" value="Notify address" />
          </GoARadioGroup>
        </GoAFormItem>
        {isNotifyAddress && (
          <div>
            <GoAFormItem label="Address" error={errors?.['address']}>
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
            <GoAFormItem label="Address Path">
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
          </div>
        )}
        {tenantClients &&
          !isNotifyAddress &&
          !type.publicSubscribe &&
          elements.map((e, key) => {
            return <SubscribeRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
          })}
      </GoAModal>
    </EditStyles>
  );
};
