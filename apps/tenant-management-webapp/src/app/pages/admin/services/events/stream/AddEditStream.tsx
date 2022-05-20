import React, { useMemo, useState } from 'react';
import { GoAButton, GoADropdownOption, GoADropdown, GoACheckbox } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { IdField, StreamModalStyles } from './styleComponents';
import { Stream } from '@store/stream/models';
import { reactInputHandlerFactory } from '@lib/reactInputHandlerFactory';
import { characterCheck, validationPattern, checkInput, isNotEmptyCheck, Validator } from '@lib/checkInput';
import { toKebabName } from '@lib/kebabName';
import { generateEventOptions, generateSubscriberRolesOptions } from './utils';
import { Role } from '@store/tenant/models';
import { EventDefinition } from '@store/event/models';

interface AddEditStreamProps {
  onSave: (stream: Stream) => void;
  onClose: () => void;
  isEdit: boolean;
  open: boolean;
  initialValue: Stream;
  realmRoles: Role[];
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
  streams,
}: AddEditStreamProps): JSX.Element => {
  const [stream, setStream] = useState<Stream>({ ...initialValue });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const errorHandler = reactInputHandlerFactory(errors, setErrors);

  const isDuplicateStreamId = (streamId: string): Validator => {
    return () => {
      return streams[streamId] ? 'Stream ID is duplicate, please use a different name to get a unique Template ID' : '';
    };
  };

  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };
  const streamEvents = useMemo(() => {
    return stream?.events.map((event) => {
      return `${event.namespace}:${event.name}`;
    });
  }, [stream.events]);

  const subscriberRolesOptions = generateSubscriberRolesOptions(realmRoles);
  const eventOptions = generateEventOptions(eventDefinitions);

  return (
    <StreamModalStyles>
      <GoAModal testId="stream-form" isOpen={open}>
        <GoAModalTitle testId="stream-form-title">{isEdit ? 'Edit stream' : 'Add stream'}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <input
                type="text"
                name="stream-name"
                value={stream.name}
                disabled={isEdit}
                data-testid="stream-name"
                aria-label="stream-name"
                onChange={(e) => {
                  checkInput(e.target.value, [checkForBadChars, isNotEmptyCheck('name')], errorHandler('name'));
                  const streamId = toKebabName(e.target.value);
                  setStream({ ...stream, name: e.target.value, id: streamId });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Template ID</label>
              <IdField>{stream.id}</IdField>
            </GoAFormItem>
            <GoAFormItem>
              <label>Description</label>
              <textarea
                name="stream-description"
                value={stream.description}
                data-testid="stream-description"
                aria-label="stream-description"
                onChange={(e) => {
                  setStream({ ...stream, description: e.target.value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Select subscriber roles</label>
              <GoADropdown
                name="subscriberRoles"
                selectedValues={stream.subscriberRoles}
                multiSelect={true}
                onChange={(name, values) => {
                  if (values[values.length - 1] === 'anonymousRead') {
                    values = values.filter((value) => !realmRoles.map((realmRole) => realmRole.name).includes(value));
                  }
                  if (values.includes('anonymousRead') && values[values.length - 1] !== 'anonymousRead') {
                    values = values.filter((value) => value !== 'anonymousRead');
                  }
                  let publicSubscribe = false;
                  if (values.includes('anonymousRead')) {
                    publicSubscribe = true;
                  }
                  setStream({ ...stream, subscriberRoles: values, publicSubscribe });
                }}
              >
                {subscriberRolesOptions.map((item) => (
                  <GoADropdownOption
                    label={item.label}
                    value={item.value}
                    key={item.key}
                    data-testid={item.dataTestId}
                  />
                ))}
              </GoADropdown>
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
                {eventOptions.map((item) => (
                  <GoADropdownOption
                    label={item.label}
                    value={item.value}
                    key={item.key}
                    data-testid={item.dataTestId}
                  />
                ))}
              </GoADropdown>
            </GoAFormItem>
            <GoAFormItem>
              <GoACheckbox
                name="streamPublic"
                checked={!!stream.publicSubscribe}
                onChange={() => {
                  setStream({ ...stream, publicSubscribe: !stream.publicSubscribe });
                }}
                data-testid="manage-stream-checkbox"
                value="manageStream"
              >
                Make this stream available to public?
              </GoACheckbox>
            </GoAFormItem>
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
            disabled={!stream.name || hasFormErrors()}
            onClick={(e) => {
              if (checkInput(stream.id, [isDuplicateStreamId(stream.id)], errorHandler('name'))) {
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
