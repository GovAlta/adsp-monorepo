import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveWebhook } from '../../../../store/status/actions';
import { Webhooks } from '../../../../store/status/models';
import DataTable from '@components/DataTable';
import { GoAButton, GoACheckbox, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { getEventDefinitions } from '@store/event/actions';
import { useValidators } from '@lib/validation/useValidators';
import { renderNoItem } from '@components/NoItem';
import styled from 'styled-components';
import { toKebabName } from '@lib/kebabName';

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
import { GoATextArea, GoAIcon } from '@abgov/react-components-new';
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

  const entries = useSelector((state: RootState) => state.event.entries);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  function save() {
    const saveHook = webhook;
    saveHook.id = saveHook.id ? saveHook.id : saveHook.name;
    dispatch(saveWebhook(webhook));
    if (onSave) onSave();
  }

  const isDuplicateWebhookKey = (): Validator => {
    return (appKey: string) => {
      const existingWebhooks = Object.keys(webhooks).filter((hook) => webhooks[hook].id === appKey);
      return existingWebhooks.length === 1 ? 'webhook key is duplicate, please use a different name' : '';
    };
  };

  const isMoreThanZero = (): Validator => {
    return (interval: number) => {
      return interval < 1 ? 'wait interval must be more than 0' : '';
    };
  };

  const { errors, validators } = useValidators(
    'nameAppKey',
    'name',
    checkForBadChars,
    wordMaxLengthCheck(32, 'Name'),
    isDuplicateWebhookKey()
  )
    .add('nameOnly', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('waitInterval', 'waitInterval', isMoreThanZero())
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
    if (!webhook?.name) return false;
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
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <GoAInput
                type="text"
                name="name"
                value={webhook?.name}
                onChange={(name, value) => {
                  if (!isEdit) {
                    const id = toKebabName(value);
                    validators['nameAppKey'].check(id);
                    setWebhook({
                      ...webhook,
                      name: value,
                      id,
                    });
                  } else {
                    validators['nameOnly'].check(value);
                    setWebhook({
                      ...webhook,
                      name: value,
                    });
                  }
                }}
                aria-label="name"
              />
            </GoAFormItem>

            <GoAFormItem>
              <label>ID</label>
              <IdField>{webhook.id}</IdField>
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
                selectedValues={[webhook.targetId]}
                onChange={(_n, [value]) =>
                  setWebhook({
                    ...webhook,
                    targetId: value,
                  })
                }
                multiSelect={false}
              >
                {applications.map((application): JSX.Element => {
                  return (
                    <GoADropdownOption
                      label={application.appKey}
                      value={application.appKey}
                      key={application.appKey}
                      visible={true}
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
            <GoAFormItem>
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
            <GoAFormItem>{entries && <EntryDetail>{JSON.stringify([entries[0]], null, 2)}</EntryDetail>}</GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="secondary"
            onClick={() => {
              if (onCancel) onCancel();
              setWebhook({ ...defaultWebhooks });
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton disabled={!isFormValid() || validators.haveErrors()} buttonType="primary" onClick={save}>
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </GoAModalStyle>
  );
};

export default WebhookFormModal;

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
