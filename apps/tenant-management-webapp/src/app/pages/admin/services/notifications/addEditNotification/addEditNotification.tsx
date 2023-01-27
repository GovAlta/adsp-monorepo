import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton, GoASkeletonGridColumnContent } from '@abgov/react-components';
import {
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAInput,
} from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { GoACallout } from '@abgov/react-components';
import styled from 'styled-components';
import { GoACheckbox, GoATextArea } from '@abgov/react-components-new';
import { toKebabName } from '@lib/kebabName';
import { Role } from '@store/tenant/models';
import { ServiceRoleConfig } from '@store/access/models';
import { AnonymousWrapper } from './styledComponents';
import { RolesTable } from './rolesTable';
import { mapTenantClientRoles } from '../../events/stream/utils';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { RootState } from '@store/index';
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
  const notificationType = useSelector((state: RootState) => state.notification.notificationTypes);
  const core = useSelector((state: RootState) => state.notification.core);
  const typeObjects = Object.values({ ...notificationType, ...core });
  const typeNames = typeObjects.map((type: NotificationItem) => type.name);
  useEffect(() => {
    setType(JSON.parse(JSON.stringify(initialValue)));
  }, [initialValue]);

  let mappedRealmRoles = [];

  if (realmRoles) {
    mappedRealmRoles = realmRoles.map((realmRole) => {
      return {
        value: realmRole.name,
        label: realmRole.name,
        key: realmRole.id,
        dataTestId: `${realmRole}-update-roles-options`,
      };
    });
  }
  const tenantClientsMappedRoles = tenantClients ? mapTenantClientRoles(tenantClients) : undefined;
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
                data-testid="form-name"
                aria-label="name"
                onChange={(name, value) => {
                  const validations = {
                    name: value,
                  };
                  validators.remove('name');
                  validations['duplicated'] = value;

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
                onChange={(name, value) => setType({ ...type, description: value })}
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
            {mappedRealmRoles ? '' : <GoASkeletonGridColumnContent key={1} rows={4}></GoASkeletonGridColumnContent>}
            {!type.publicSubscribe && mappedRealmRoles ? (
              <RolesTable
                tableHeading={'Roles'}
                key={'roles'}
                subscriberRolesOptions={mappedRealmRoles}
                checkedRoles={type.subscriberRoles}
                onItemChecked={(value) => {
                  if (type.subscriberRoles.includes(value)) {
                    const updatedRoles = type.subscriberRoles.filter((roleName) => roleName !== value);
                    setType({ ...type, subscriberRoles: updatedRoles });
                  } else {
                    setType({ ...type, subscriberRoles: [...type.subscriberRoles, value] });
                  }
                }}
              />
            ) : (
              // some extra white space so the modal height/width stays the same when roles are hidden
              <div
                style={{
                  width: '35em',
                  height: '8em',
                }}
              ></div>
            )}
            {tenantClientsMappedRoles ? (
              ''
            ) : (
              <GoASkeletonGridColumnContent key={1} rows={4}></GoASkeletonGridColumnContent>
            )}
            {!type.publicSubscribe && tenantClientsMappedRoles
              ? tenantClientsMappedRoles.map((tenantRole) => {
                  return (
                    tenantRole.roles.length > 0 && (
                      <RolesTable
                        tableHeading={tenantRole.name}
                        key={tenantRole.name}
                        subscriberRolesOptions={tenantRole.roles}
                        checkedRoles={type.subscriberRoles}
                        onItemChecked={(value) => {
                          if (type.subscriberRoles.includes(value)) {
                            const updatedRoles = type.subscriberRoles.filter((roleName) => roleName !== value);
                            setType({ ...type, subscriberRoles: updatedRoles });
                          } else {
                            setType({ ...type, subscriberRoles: [...type.subscriberRoles, value] });
                          }
                        }}
                      />
                    )
                  );
                })
              : ''}
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            data-testid="form-cancel"
            buttonType="secondary"
            type="button"
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
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            onClick={(e) => {
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
