import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveWebhook } from '@store/status/actions';
import { Webhooks } from '@store/status/models';
import { selectWebhookInStatus } from '@store/status/selectors';
import {
  GoADropdown,
  GoADropdownItem,
  GoAButton,
  GoACheckbox,
  GoAButtonGroup,
  GoATextArea,
  GoAIcon,
  GoAInput,
  GoAFormItem,
  GoAModal,
} from '@abgov/react-components';
import { getEventDefinitions } from '@store/event/actions';
import { useValidators } from '@lib/validation/useValidators';
import { renderNoItem } from '@components/NoItem';
import styled from 'styled-components';
import { HelpText } from '../../styled-components';
import {
  characterCheck,
  validationPattern,
  isNotEmptyCheck,
  Validator,
  wordMaxLengthCheck,
} from '@lib/validation/checkInput';
import { RootState } from '@store/index';
import { v4 as uuidv4 } from 'uuid';
import { ResetModalState } from '@store/session/actions';
import { PageIndicator } from '@components/Indicator';
export const WebhookFormModal = (): JSX.Element => {
  const dispatch = useDispatch();
  const selectedWebhook = useSelector(selectWebhookInStatus);
  const [webhook, setWebhook] = useState<Webhooks | undefined>(selectedWebhook);
  const [loaded, setLoaded] = useState<boolean>(true);
  const { applications, webhooks } = useSelector((state: RootState) => state.serviceStatus);

  const isEdit = selectedWebhook?.id?.length > 0;

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  useEffect(() => {
    dispatch(getEventDefinitions());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedWebhook?.id === '') {
      setWebhook(selectedWebhook);
      return;
    }

    /*
     There is no need to reset webhook when selectedWebhook is same as the previous selected.
    */
    if (selectedWebhook !== undefined && selectedWebhook.id !== webhook?.id) {
      setWebhook(selectedWebhook);
    }
    setLoaded(true);
  }, [selectedWebhook]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    if (!isFormValid()) {
      return;
    }

    if (!isEdit) {
      webhook.id = uuidv4();
    }
    dispatch(saveWebhook(webhook));
    setLoaded(false);
  }

  const isDuplicateWebhookName = (): Validator => {
    return (name: string) => {
      const existingWebhooks = webhooks && Object.keys(webhooks).filter((hook) => webhooks[hook]?.name === name);
      return existingWebhooks?.length === 1 ? 'webhook name is duplicate, please use a different name' : '';
    };
  };
  const atLeastOne = (): Validator => {
    return (events: object[]) => {
      return events.length === 0 ? 'please select at least one event' : '';
    };
  };

  const isMoreThanZero = (): Validator => {
    return (interval: number) => {
      return interval < 1 ? 'wait interval must be more than 0' : '';
    };
  };

  const { errors, validators } = useValidators('nameAppKey', 'name', checkForBadChars, wordMaxLengthCheck(32, 'Name'))
    .add('nameOnly', 'name', checkForBadChars, isNotEmptyCheck('name'), isDuplicateWebhookName())
    .add('waitInterval', 'waitInterval', isMoreThanZero())
    .add('events', 'events', atLeastOne())
    .add(
      'url',
      'url',
      wordMaxLengthCheck(150, 'URL'),
      characterCheck(validationPattern.validURL),
      isNotEmptyCheck('url')
    )
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const descErrMessage = 'Description can not be over 180 characters';

  const definitions = useSelector((state: RootState) => state.event.results.map((r) => state.event.definitions[r]));

  const groupedDefinitions = definitions.reduce((acc, def) => {
    acc[def.namespace] = acc[def.namespace] || [];
    acc[def.namespace].push(def);
    return acc;
  }, {});
  let orderedGroupNames = Object.keys(groupedDefinitions).sort((prev, next): number => {
    if (groupedDefinitions[prev][0].isCore > groupedDefinitions[next][0].isCore) {
      return 1;
    }
    if (prev > next) {
      return 1;
    }
    return -1;
  });

  function isFormValid(): boolean {
    return webhook?.eventTypes?.length !== 0 && webhook?.url && webhook?.targetId !== '' && !validators?.haveErrors();
  }

  orderedGroupNames = [
    ...Object.keys(groupedDefinitions).filter((g) => g === 'status-service'),
    ...Object.keys(groupedDefinitions).filter((g) => g !== 'status-service'),
  ];

  return (
    <GoAModal
      open={selectedWebhook !== undefined}
      testId={isEdit ? 'edit-webhook' : 'add-webhook'}
      heading={isEdit ? 'Edit webhook' : 'Add webhook'}
      actions={
        loaded && (
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="webhook-from-cancel-button"
              onClick={() => {
                dispatch(ResetModalState());
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              testId="webhook-from-save-button"
              disabled={!isFormValid() || validators.haveErrors()}
              type="primary"
              onClick={save}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        )
      }
    >
      {loaded ? (
        <>
          <GoAFormItem error={errors?.['name']} label="Name">
            <GoAInput
              type="text"
              name="name"
              width="100%"
              testId="webhook-name-input"
              value={webhook?.name}
              onChange={(name, value) => {
                validators['nameOnly'].check(value);

                setWebhook({
                  ...webhook,
                  name: value,
                });
              }}
              aria-label="name"
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['url']} label="Url">
            <GoAInput
              name="url"
              type="url"
              width="100%"
              testId="webhook-url-input"
              value={webhook?.url}
              onChange={(name, value) => {
                validators.remove('url');
                validators['url'].check(value);
                setWebhook({
                  ...webhook,
                  url: value,
                });
              }}
              aria-label="description"
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['waitInterval']} label="Wait Interval">
            <GoAInput
              name="interval"
              type="number"
              width="50%"
              testId="webhook-wait-interval-input"
              value={(webhook?.intervalMinutes || '').toString()}
              onChange={(name, value) => {
                validators['waitInterval'].check(parseInt(value));
                setWebhook({
                  ...webhook,
                  intervalMinutes: parseInt(value),
                });
              }}
              aria-label="description"
              trailingContent="min"
            />
          </GoAFormItem>

          <GoAFormItem label="Application">
            <GoADropdown
              name="targetId"
              value={webhook?.targetId}
              onChange={(_n, value: string) =>
                setWebhook({
                  ...webhook,
                  targetId: value,
                })
              }
              aria-label="select-webhook-dropdown"
              relative={true}
              width="55ch"
              testId="webhook-application-dropdown"
            >
              {applications.map((application) => (
                <GoADropdownItem
                  name="targetId"
                  label={application.appKey}
                  value={application.appKey}
                  key={application.appKey}
                />
              ))}
            </GoADropdown>
          </GoAFormItem>
          <GoAFormItem label="Description">
            <GoATextArea
              name="description"
              value={webhook?.description}
              width="100%"
              onKeyPress={(name, value, key) => {
                validators.remove('description');
                validators['description'].check(value);
                setWebhook({
                  ...webhook,
                  description: value,
                });
              }}
              // eslint-disable-next-line
              onChange={(name, value) => {}}
              aria-label="description"
            />
            <HelpText>
              {webhook?.description?.length <= 180 ? (
                <div> {descErrMessage} </div>
              ) : (
                <ErrorMsg>
                  <GoAIcon type="warning" size="small" theme="filled" ariaLabel="warning" />
                  {`  ${errors?.['description']}`}
                </ErrorMsg>
              )}
              <div>{`${webhook?.description?.length}/180`}</div>
            </HelpText>
          </GoAFormItem>
          <GoAFormItem error={errors?.['events']} label="Events">
            {!orderedGroupNames && renderNoItem('event definition')}
            {['monitored-service-down', 'monitored-service-up'].map((name) => {
              return (
                <GoACheckbox
                  name={name}
                  key={`${name}:${Math.random()}`}
                  testId="webhook-name"
                  checked={webhook?.eventTypes?.map((e) => e.id).includes(`status-service:${name}`)}
                  onChange={(value: string) => {
                    const eventTypes = webhook?.eventTypes?.map((e) => e.id);
                    const elementLocation = eventTypes?.indexOf(`status-service:${name}`);
                    if (elementLocation === -1) {
                      eventTypes.push(`status-service:${value}`);
                    } else {
                      eventTypes.splice(elementLocation, 1);
                    }

                    validators['events'].check(eventTypes);

                    setWebhook({
                      ...webhook,
                      eventTypes: eventTypes.map((e) => ({ id: e })),
                    });
                  }}
                >
                  {name}
                </GoACheckbox>
              );
            })}
          </GoAFormItem>
        </>
      ) : (
        <PageIndicator />
      )}
    </GoAModal>
  );
};

export default WebhookFormModal;

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const ErrorMsg = styled.div`
   {
    display: inline-flex;
    color: var(--color-red);
    pointer-events: none;
    gap: 0.25rem;
  }
`;

export const Events = styled.div`
   {
    display: flex;
  }
`;

export const NoPaddingTd = styled.td`
  padding: 0px !important;
`;
