import React, { useMemo, useState } from 'react';
import { GoAButton, GoADropdownOption, GoADropdown, GoACheckbox } from '@abgov/react-components';
import {
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAInput,
} from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { AnonymousWrapper, ChipsWrapper, IdField, StreamModalStyles } from '../styleComponents';
import { Stream } from '@store/stream/models';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';
import { toKebabName } from '@lib/kebabName';
import { generateEventOptions, generateSubscriberRolesOptions, mapTenantClientRoles } from '../utils';
import { Role } from '@store/tenant/models';
import { EventDefinition } from '@store/event/models';
import { RolesTable } from './rolesTable';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { ServiceRoleConfig } from '@store/access/models';
import { GoAChip } from '@abgov/react-components-new';

interface AddEditStreamProps {
  onSave: (stream: Stream) => void;
  onClose: () => void;
  isEdit: boolean;
  open: boolean;
  initialValue: Stream;
  realmRoles: Role[];
  tenantClients: ServiceRoleConfig;
  eventDefinitions: Record<string, EventDefinition>;
  streams: Record<string, Stream>;
}
export const AddEditStream = ({
  onSave,
  open,
  isEdit,
  initialValue,
  onClose,
  realmRoles,
  eventDefinitions,
  tenantClients,
  streams,
}: AddEditStreamProps): JSX.Element => {
  const [stream, setStream] = useState<Stream>({ ...initialValue });

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const isDuplicateStreamId = (): Validator => {
    return (streamId: string) => {
      return streams[streamId] ? 'Stream ID is duplicate, please use a different name to get a unique Stream ID' : '';
    };
  };

  const { errors, validators } = useValidators('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('duplicate', 'name', isDuplicateStreamId())
    .build();

  const streamEvents = useMemo(() => {
    return stream?.events.map((event) => {
      return `${event.namespace}:${event.name}`;
    });
  }, [stream.events]);

  const subscriberRolesOptions = realmRoles ? generateSubscriberRolesOptions(realmRoles) : undefined;
  const eventOptions = eventDefinitions ? generateEventOptions(eventDefinitions) : undefined;
  const tenantClientsMappedRoles = tenantClients ? mapTenantClientRoles(tenantClients) : undefined;

  const deleteEventChip = (eventChip) => {
    const updatedStreamEvents = streamEvents.filter((event) => event !== eventChip);
    setStream({
      ...stream,
      events: updatedStreamEvents.map((event) => {
        return {
          namespace: event.split(':')[0],
          name: event.split(':')[1],
        };
      }),
    });
  };
  return (
    <StreamModalStyles>
      <GoAModal testId="stream-form" isOpen={open}>
        <GoAModalTitle testId="stream-form-title">{isEdit ? 'Edit stream' : 'Add stream'}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <GoAInput
                type="text"
                name="stream-name"
                value={stream.name}
                disabled={isEdit}
                data-testid="stream-name"
                aria-label="stream-name"
                onChange={(name, value) => {
                  validators['name'].check(value);
                  const streamId = toKebabName(value);
                  setStream({ ...stream, name: value, id: streamId });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Stream ID</label>
              <IdField>{stream.id}</IdField>
            </GoAFormItem>
            <GoAFormItem>
              <label>Description</label>
              <textarea
                name="stream-description"
                value={stream.description}
                data-testid="stream-description"
                aria-label="stream-description"
                className="goa-textarea"
                onChange={(e) => {
                  setStream({ ...stream, description: e.target.value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Select events</label>
              <GoADropdown
                name="streamEvents"
                selectedValues={streamEvents}
                multiSelect={true}
                onChange={(name, values) => {
                  setStream({
                    ...stream,
                    events: values.map((event) => {
                      return {
                        namespace: event.split(':')[0],
                        name: event.split(':')[1],
                      };
                    }),
                  });
                }}
              >
                {eventOptions
                  .sort((a, b) => (a.name < b.name ? -1 : 1))
                  .map((item) => (
                    <GoADropdownOption
                      label={item.label}
                      value={item.value}
                      key={item.key}
                      data-testid={item.dataTestId}
                    />
                  ))}
              </GoADropdown>
            </GoAFormItem>
            <ChipsWrapper>
              {streamEvents.map((eventChip) => {
                return (
                  <GoAChip
                    key={eventChip}
                    deletable={true}
                    content={eventChip}
                    onClick={() => deleteEventChip(eventChip)}
                  />
                );
              })}
            </ChipsWrapper>

            <AnonymousWrapper>
              <GoACheckbox
                checked={stream.publicSubscribe}
                name="stream-anonymousRead-checkbox"
                data-testid="stream-anonymousRead-checkbox"
                onChange={() => {
                  setStream({
                    ...stream,
                    publicSubscribe: !stream.publicSubscribe,
                  });
                }}
              />
              Make stream public
            </AnonymousWrapper>
            {subscriberRolesOptions ? (
              ''
            ) : (
              <GoASkeletonGridColumnContent key={1} rows={4}></GoASkeletonGridColumnContent>
            )}
            {!stream.publicSubscribe && subscriberRolesOptions ? (
              <RolesTable
                tableHeading="Roles"
                key={'roles'}
                subscriberRolesOptions={subscriberRolesOptions}
                checkedRoles={stream.subscriberRoles}
                onItemChecked={(value) => {
                  if (stream.subscriberRoles.includes(value)) {
                    const updatedRoles = stream.subscriberRoles.filter((roleName) => roleName !== value);
                    setStream({ ...stream, subscriberRoles: updatedRoles });
                  } else {
                    setStream({ ...stream, subscriberRoles: [...stream.subscriberRoles, value] });
                  }
                }}
              />
            ) : (
              // some extra white space so the modal height/width stays the same when roles are hidden
              <div
                style={{
                  width: '33em',
                  height: '6em',
                }}
              ></div>
            )}

            {tenantClientsMappedRoles ? (
              ''
            ) : (
              <>
                <br />
                <GoASkeletonGridColumnContent key={2} rows={4}></GoASkeletonGridColumnContent>
              </>
            )}
            {!stream.publicSubscribe && tenantClientsMappedRoles
              ? tenantClientsMappedRoles.map((tenantRole) => {
                  return (
                    tenantRole.roles.length > 0 && (
                      <RolesTable
                        tableHeading={tenantRole.name}
                        key={tenantRole.name}
                        subscriberRolesOptions={tenantRole.roles}
                        checkedRoles={stream.subscriberRoles}
                        onItemChecked={(value) => {
                          if (stream.subscriberRoles.includes(value)) {
                            const updatedRoles = stream.subscriberRoles.filter((roleName) => roleName !== value);
                            setStream({ ...stream, subscriberRoles: updatedRoles });
                          } else {
                            setStream({ ...stream, subscriberRoles: [...stream.subscriberRoles, value] });
                          }
                        }}
                      />
                    )
                  );
                })
              : ''}
            <br />
            <br />
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            data-testid="form-cancel"
            buttonType="secondary"
            type="button"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            disabled={!stream.name || validators.haveErrors()}
            onClick={(e) => {
              if (!isEdit && validators['duplicate'].check(stream.id)) {
                e.stopPropagation();
                return;
              }
              onSave(stream);
              onClose();
            }}
          >
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </StreamModalStyles>
  );
};
