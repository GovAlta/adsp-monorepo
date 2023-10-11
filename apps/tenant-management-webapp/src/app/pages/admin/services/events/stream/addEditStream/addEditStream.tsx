import React, { useMemo, useState, useEffect } from 'react';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components';
import { AnonymousWrapper, ChipsWrapper, IdField, StreamModalStyles } from '../styleComponents';
import { Stream, EditModalType, AddModalType } from '@store/stream/models';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { toKebabName } from '@lib/kebabName';
import { generateEventOptions } from '../utils';
import { EventDefinition } from '@store/event/models';
import { ClientRoleTable } from '@components/RoleTable';
import {
  GoAChip,
  GoACheckbox,
  GoAInput,
  GoATextArea,
  GoAButton,
  GoAButtonGroup,
  GoASkeleton,
  GoAFormItem,
  GoAModal,
} from '@abgov/react-components-new';
import { initialStream } from '@store/stream/models';
import { selectAddEditInitStream } from '@store/stream/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { ResetModalState } from '@store/session/actions';
import { selectModalStateByType } from '@store/session/selectors';
import { selectRolesObject, constructRoleObjFromUrns, roleObjectToUrns } from '@store/sharedSelectors/roles';

interface AddEditStreamProps {
  onSave: (stream: Stream) => void;
  eventDefinitions: Record<string, EventDefinition>;
  streams: Record<string, Stream>;
}

export const AddEditStream = ({ onSave, eventDefinitions, streams }: AddEditStreamProps): JSX.Element => {
  const initStream = useSelector(selectAddEditInitStream) as Stream;
  const [stream, setStream] = useState<Stream>(initStream);
  const dispatch = useDispatch();
  const editModal = useSelector(selectModalStateByType(EditModalType));
  const addModal = useSelector(selectModalStateByType(AddModalType));
  const isOpen = editModal?.isOpen || addModal?.isOpen;
  const isEdit = editModal.isOpen;
  const rolesObj = useSelector(selectRolesObject);
  const selectedRoles = constructRoleObjFromUrns(initStream?.subscriberRoles);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    isNotEmptyCheck('name'),
    wordMaxLengthCheck(32, 'Name')
  )
    .add('duplicate', 'name', duplicateNameCheck(Object.keys(streams), 'Stream'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  const streamEvents = useMemo(() => {
    return stream?.events.map((event) => {
      return `${event.namespace}:${event.name}`;
    });
  }, [stream?.events]);

  const eventOptions = eventDefinitions ? generateEventOptions(eventDefinitions) : undefined;

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

  useEffect(() => {
    if (stream.id !== initStream.id) {
      setStream(initStream);
    }
  }, [initStream, rolesObj]);

  return (
    <StreamModalStyles>
      <GoAModal
        testId="stream-form"
        open={isOpen}
        heading={isEdit ? 'Edit stream' : 'Add stream'}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                validators.clear();
                dispatch(ResetModalState());
                setStream(initialStream);
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              testId="form-save"
              disabled={!stream?.name || validators.haveErrors()}
              onClick={() => {
                if (!isEdit && validators['duplicate'].check(stream.id)) {
                  return;
                }
                onSave(stream);
                dispatch(ResetModalState());
                setStream(initialStream);
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="stream-name"
            width="100%"
            value={stream.name}
            disabled={isEdit}
            testId="stream-name"
            aria-label="stream-name"
            onChange={(name, value) => {
              validators.remove('name');
              validators['name'].check(value);
              const streamId = toKebabName(value);
              setStream({ ...stream, name: value, id: streamId });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Stream ID">
          <IdField>{stream.id}</IdField>
        </GoAFormItem>
        <GoAFormItem label="Description">
          <label></label>
          <GoATextArea
            name="stream-description"
            value={stream.description}
            testId="stream-description"
            aria-label="stream-description"
            width="100%"
            onChange={(name, value) => {
              validators.remove('description');
              validators['description'].check(value);
              setStream({ ...stream, description: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Select events">
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
                <GoADropdownOption label={item.label} value={item.value} key={item.key} data-testid={item.dataTestId} />
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
            testId="stream-anonymousRead-checkbox"
            onChange={() => {
              setStream({
                ...stream,
                publicSubscribe: !stream.publicSubscribe,
              });
            }}
            ariaLabel={`stream-anonymousRead-checkbox`}
          />
          Make stream public
        </AnonymousWrapper>
        {rolesObj ? '' : <GoASkeleton type="text" />}
        {!stream.publicSubscribe && rolesObj ? (
          Object.entries(rolesObj).map(([clientId, roles]) => {
            return (
              <ClientRoleTable
                roles={roles || []}
                roleSelectFunc={(roleNames, type) => {
                  if (roleNames && roleNames.length > 0) {
                    selectedRoles[clientId] = roleNames.map((r) => r.split(':').pop());
                  } else {
                    selectedRoles[clientId] = [];
                  }
                  // no need to use setStream here.
                  stream.subscriberRoles = roleObjectToUrns(selectedRoles);
                }}
                clientId={clientId}
                key={`client-role-group-${clientId}`}
                service={`client-role-group-${clientId}`}
                nameColumnWidth={80}
                checkedRoles={[
                  {
                    title: 'Subscribe',
                    selectedRoles: selectedRoles?.[clientId]?.map((r) => `${clientId}:${r}`) || [],
                  },
                ]}
              />
            );
          })
        ) : (
          // some extra white space so the modal height/width stays the same when roles are hidden
          <div
            style={{
              width: '100%',
              height: '6em',
            }}
          ></div>
        )}

        <br />
        <br />
      </GoAModal>
    </StreamModalStyles>
  );
};
