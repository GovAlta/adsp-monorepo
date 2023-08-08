import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveWebhook } from '../../../../store/status/actions';
import { Webhooks } from '../../../../store/status/models';
import DataTable from '@components/DataTable';
import {
  GoADropdown,
  GoADropdownOption,
  GoAButton,
  GoACheckbox,
  GoAButtonGroup,
  GoATextArea,
  GoAIcon,
} from '@abgov/react-components-new';
import { getEventDefinitions } from '@store/event/actions';
import { useValidators } from '@lib/validation/useValidators';
import { renderNoItem } from '@components/NoItem';
import styled from 'styled-components';

import {
  characterCheck,
  validationPattern,
  isNotEmptyCheck,
  Validator,
  wordMaxLengthCheck,
} from '@lib/validation/checkInput';

import {
  GoAForm,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';

import { RootState } from '../../../../store/index';

interface Props {
  isOpen: boolean;
  title: string;
  testId: string;
  isEdit: boolean;
  defaultWebhooks: Webhooks;
  onCancel?: () => void;
  onSave?: () => void;
}

export const WebhookFormModal: FC<Props> = ({
  isOpen,
  title,
  onCancel,
  onSave,
  testId,
  defaultWebhooks,
  isEdit,
}: Props) => {
  const dispatch = useDispatch();
  const [webhook, setWebhook] = useState<Webhooks>({ ...defaultWebhooks });

  const { applications, webhooks } = useSelector((state: RootState) => state.serviceStatus);

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  function save() {
    if (!isFormValid()) {
      return;
    }
    const saveHook = webhook;
    if (!isEdit) {
      saveHook.id = (Math.random() + 1).toString(36).substring(2);
    }

    dispatch(saveWebhook(webhook));
    if (onSave) onSave();
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
    if (webhook?.eventTypes.length === 0) return false;
    if (!webhook?.url) return false;
    return !validators.haveErrors();
  }

  orderedGroupNames = [
    ...Object.keys(groupedDefinitions).filter((g) => g === 'status-service'),
    ...Object.keys(groupedDefinitions).filter((g) => g !== 'status-service'),
  ];

  return (
    <GoAModalStyle>
      <GoAModal isOpen={isOpen} testId={testId}>
        <GoAModalTitle>{title}</GoAModalTitle>
        <GoAModalContent>
          <GoAWrapper>
            <GoAForm>
              <GoAFormItem error={errors?.['name']}>
                <label>Name</label>
                <GoAInput
                  type="text"
                  name="name"
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

              <GoAFormItem error={errors?.['url']}>
                <label>Url</label>
                <GoAInput
                  name="url"
                  type="text"
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
              <GoAFormItem error={errors?.['waitInterval']}>
                <label>Wait Interval</label>
                <div style={{ display: 'flex' }}>
                  <GoAInput
                    name="interval"
                    type="number"
                    value={(webhook?.intervalMinutes || '').toString()}
                    onChange={(name, value) => {
                      validators['waitInterval'].check(parseInt(value));
                      setWebhook({
                        ...webhook,
                        intervalMinutes: parseInt(value),
                      });
                    }}
                    aria-label="description"
                  />
                  <div className="minute-button">min</div>
                </div>
              </GoAFormItem>

              <GoAFormItem>
                <label>Application</label>
                <GoADropdown
                  name="Application"
                  value={[webhook.targetId]}
                  onChange={(_n, [value]) =>
                    setWebhook({
                      ...webhook,
                      targetId: value,
                    })
                  }
                  aria-label="select-webhook-dropdown"
                  width="100%"
                >
                  {applications.map((application): JSX.Element => {
                    return (
                      <GoADropdownOption
                        label={application.appKey}
                        value={application.appKey}
                        key={application.appKey}
                      />
                    );
                  })}
                </GoADropdown>
              </GoAFormItem>
              <GoAFormItem>
                <label>Description</label>
                <GoATextArea
                  name="description"
                  value={webhook?.description}
                  onChange={(name, value) => {
                    validators.remove('description');
                    validators['description'].check(value);
                    setWebhook({
                      ...webhook,
                      description: value,
                    });
                  }}
                  aria-label="description"
                />
                <HelpText>
                  {webhook.description?.length <= 180 ? (
                    <div> {descErrMessage} </div>
                  ) : (
                    <ErrorMsg>
                      <GoAIcon type="warning" size="small" theme="filled" />
                      {`  ${errors?.['description']}`}
                    </ErrorMsg>
                  )}
                  <div>{`${webhook.description?.length}/180`}</div>
                </HelpText>
              </GoAFormItem>
              <GoAFormItem error={errors?.['events']}>
                <label className="margin-bottom">Events</label>
                {!orderedGroupNames && renderNoItem('event definition')}

                <DataTable data-testid="events-definitions-table">
                  {['monitored-service-down', 'monitored-service-up'].map((name) => {
                    return (
                      <Events>
                        <GoACheckbox
                          name={name}
                          key={`${name}:${Math.random()}`}
                          checked={webhook.eventTypes?.map((e) => e.id).includes(`status-service:${name}`)}
                          onChange={(value: string) => {
                            const eventTypes = webhook.eventTypes?.map((e) => e.id);
                            const elementLocation = eventTypes.indexOf(`status-service:${name}`);
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
                      </Events>
                    );
                  })}
                </DataTable>
              </GoAFormItem>
            </GoAForm>
          </GoAWrapper>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                if (onCancel) onCancel();
                setWebhook({ ...defaultWebhooks });
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton disabled={!isFormValid() || validators.haveErrors()} type="primary" onClick={save}>
              Save
            </GoAButton>
          </GoAButtonGroup>
        </GoAModalActions>
      </GoAModal>
    </GoAModalStyle>
  );
};

export default WebhookFormModal;

const GoAWrapper = styled.div`
  width: 578px;
`;

const GoAModalStyle = styled.div`
  .group-name {
    font-size: var(--fs-lg);
    font-weight: var(--fw-bold);
  }

  .margin-bottom {
    margin-bottom: 0.75rem;
  }

  .minute-button {
    border: 1px solid #666666;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    background: #f1f1f1;
    padding: 7px 12px 7px 12px;
    margin-left: -3px;
  }
`;

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const HelpText = styled.div`
  font-size: var(--fs-sm);
  color: var(--color-gray-900);
  line-height: calc(var(--fs-sm) + 0.5rem);
  display: flex;
  display-direction: row;
  justify-content: space-between;
  margin-top: 2px;
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

export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 12px;
  padding: 16px;
  text-align: left;
`;
