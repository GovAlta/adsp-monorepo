import React, { useMemo, useState, useEffect } from 'react';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components-old';
import { ChipsWrapper, IdField, StreamModalStyles } from '../styleComponents';
import { Stream, EditModalType, AddModalType } from '@store/stream/models';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { toKebabName } from '@lib/kebabName';
import { generateEventOptions } from '../utils';
import { EventDefinition } from '@store/event/models';
import { ClientRoleTable } from '@components/RoleTable';
import {
  GoabFilterChip,
  GoabCheckbox,
  GoabInput,
  GoabTextArea,
  GoabButton,
  GoabButtonGroup,
  GoabSkeleton,
  GoabFormItem,
  GoabModal,
} from '@abgov/react-components';
import { initialStream } from '@store/stream/models';
import { selectAddEditInitStream } from '@store/stream/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { ResetModalState } from '@store/session/actions';
import { selectModalStateByType } from '@store/session/selectors';
import { selectRolesObject, constructRoleObjFromUrns, roleObjectToUrns } from '@store/sharedSelectors/roles';
import { HelpTextComponent } from '@components/HelpTextComponent';
import { GoabTextAreaOnKeyPressDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';

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
    let eventNames: string[] = [];

    if (stream?.events !== undefined && stream.events !== null) {
      eventNames = stream?.events?.map((event) => {
        return `${event.namespace}:${event.name}`;
      });
    }
    return eventNames;
  }, [stream?.events]);

  const eventOptions = eventDefinitions ? generateEventOptions(eventDefinitions) : undefined;
  const descErrMessage = 'Event stream description can not be over 180 characters';
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
  }, [initStream, rolesObj]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StreamModalStyles>
      <GoabModal
        testId="stream-form"
        open={isOpen}
        heading={isEdit ? 'Edit stream' : 'Add stream'}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                validators.clear();
                dispatch(ResetModalState());
                setStream(initialStream);
              }}
            >
              Cancel
            </GoabButton>
            <GoabButton
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
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem error={errors?.['name']} label="Name">
          <GoabInput
            type="text"
            name="stream-name"
            width="100%"
            value={stream.name}
            disabled={isEdit}
            testId="stream-name"
            aria-label="stream-name"
            onChange={(detail: GoabInputOnChangeDetail) => {
              validators.remove('name');
              validators['name'].check(detail.value);
              const streamId = toKebabName(detail.value);
              setStream({ ...stream, name: detail.value, id: streamId });
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="Stream ID">
          <IdField>{stream.id}</IdField>
        </GoabFormItem>
        <GoabFormItem label="Description">
          <GoabTextArea
            name="stream-description"
            value={stream.description}
            testId="stream-description"
            aria-label="stream-description"
            width="100%"
            onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
              validators.remove('description');
              validators['description'].check(detail.value);
              setStream({ ...stream, description: detail.value });
            }}
            // eslint-disable-next-line
            onChange={() => {}}
          />
          <HelpTextComponent
            length={stream?.description?.length || 0}
            maxLength={180}
            descErrMessage={descErrMessage}
            errorMsg={errors?.['description']}
          />
        </GoabFormItem>
        <GoabFormItem label="Select events">
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
        </GoabFormItem>
        <ChipsWrapper>
          {streamEvents.map((eventChip) => {
            return <GoabFilterChip key={eventChip} content={eventChip} onClick={() => deleteEventChip(eventChip)} />;
          })}
        </ChipsWrapper>

        <GoabCheckbox
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
          text="Make stream public"
        />

        {rolesObj ? '' : <GoabSkeleton type="text" />}
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
                service={'event-stream'}
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
      </GoabModal>
    </StreamModalStyles>
  );
};
