import React, { useState, useEffect } from 'react';
import { CacheTarget, InvalidationEvent } from '@store/cache/model';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { RootState } from '@store/index';
import { generateEventOptions } from '../events/stream/utils';
import { useDispatch, useSelector } from 'react-redux';
import { defaultCacheTarget } from '@store/cache/model';
import { getEventDefinitions } from '@store/event/actions';
import { fetchDirectory } from '@store/directory/actions';
import { selectSortedDirectory } from '@store/directory/selectors';
import { GoADropdownOption, GoADropdown as GoADropDownOld } from '@abgov/react-components-old';
import { Mt, MbS, MbXs } from './style-components';

import {
  GoabInput,
  GoabModal,
  GoabButtonGroup,
  GoabFormItem,
  GoabButton,
  GoabDropdownItem,
  GoabDropdown,
} from '@abgov/react-components';
import { GoabInputOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';

interface AddEditTargetCacheProps {
  open: boolean;
  isEdit: boolean;
  currentValue?: CacheTarget;
  onClose: () => void;
  onSave: (target: CacheTarget) => void;
}

export const AddEditTargetCache = ({
  currentValue,
  isEdit,
  onClose,
  open,
  onSave,
}: AddEditTargetCacheProps): JSX.Element => {
  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);
  const initialTarget = isEdit ? currentValue : defaultCacheTarget;
  const [target, setTarget] = useState<CacheTarget>(initialTarget);
  const [invalidationEventArray, setInvalidationEventArray] = useState<InvalidationEvent[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  const eventOptions = eventDefinitions ? generateEventOptions(eventDefinitions) : undefined;

  const { tenantDirectory } = useSelector(selectSortedDirectory);

  const targets = useSelector((state: RootState) => {
    return state.cache?.targets;
  });

  const definitionIds = [
    ...Object.values(targets.core).map((x) => x.urn),
    ...Object.values(targets.tenant).map((x) => x.urn),
  ];

  useEffect(() => {
    if (Object.keys(targets).length > 0 && !isEdit) {
      if (validators['duplicate'].check(target.urn)) {
        onClose();
      }
    }
  }, [targets]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchDirectory());
  }, [dispatch]);

  const invalidationEvents = invalidationEventArray.map((event) => {
    return `${event.namespace}:${event.name}`;
  });

  useEffect(() => {
    setTarget(initialTarget);
  }, [open, initialTarget]);

  useEffect(() => {
    setInvalidationEventArray(target.invalidationEvents);
  }, [target]);

  const { errors, validators } = useValidators('urn', 'urn', isNotEmptyCheck('urn'))
    .add('duplicate', 'urn', duplicateNameCheck(definitionIds, 'urn'))
    .build();

  return (
    <GoabModal
      testId="cache-target-modal"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} target`}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            testId="add-edit-target-cancel"
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="target-save"
            disabled={!target.urn || validators.haveErrors()}
            onClick={() => {
              if (!isEdit) {
                const validations = {
                  duplicate: target.urn,
                };
                if (!validators.checkAll(validations)) {
                  return;
                }
              }
              onSave(target);
            }}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <div style={{ height: '660px' }}>
        <div>
          <GoabFormItem error={errors?.['urn']} label="Target" mb="3" mt="3">
            <GoabDropdown
              name="target"
              testId="target"
              width="100%"
              disabled={isEdit}
              value={target.urn}
              onChange={(detail: GoabDropdownOnChangeDetail) => {
                validators.clear();
                setTarget({ ...target, urn: detail.value });
              }}
            >
              {tenantDirectory &&
                tenantDirectory.map((directory,index) => <GoabDropdownItem value={directory.urn} label={directory.urn} key={index} />)}
            </GoabDropdown>
          </GoabFormItem>

          {tenantDirectory && (
            <GoabFormItem label="Url" mb="5" mt="5">
              <GoabInput
                name="target-url"
                testId="target-url"
                width="100%"
                disabled={true}
                value={tenantDirectory.find((directory) => directory.urn === target.urn)?.url}
              />
            </GoabFormItem>
          )}

          <GoabFormItem error={errors?.['formDraftUrlTemplate']} label="TTL" mb="3" mt="3">
            <GoabInput
              name="target-ttl-seconds"
              type="number"
              min="0"
              max="2000000000"
              step={1}
              value={target?.ttl?.toString()}
              testId="target-ttl-seconds"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                const cleanedValue = detail.value.replace(/[e.-]/g, '');
                setTarget({ ...target, ttl: Math.min(parseInt(cleanedValue) || 0, 2000000000) });
              }}
              trailingContent="seconds"
            />
          </GoabFormItem>
          {open && (
            <GoabFormItem label="Select invalidation events">
              <GoADropDownOld
                name="invalidationEvents"
                selectedValues={invalidationEvents}
                multiSelect={true}
                onChange={(name, values) => {
                  const invalidEvents = values.map((event, index) => {
                    return {
                      namespace: event.split(':')[0],
                      name: event.split(':')[1],
                      resourceIdPath: target?.invalidationEvents[index]?.resourceIdPath || 'urn',
                    };
                  });

                  setInvalidationEventArray(invalidEvents);
                  setTarget({ ...target, invalidationEvents: invalidEvents });
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
              </GoADropDownOld>
            </GoabFormItem>
          )}
          <Mt>
            <p>
              <b>Resource Paths</b>
            </p>
          </Mt>
          {invalidationEventArray.map((event, i) => (
            <MbS>
              <MbXs>
                {event.namespace}:{event.name}
              </MbXs>
              <GoabInput
                data-testid={`${invalidationEvents}-${i}`}
                name={`${invalidationEvents}-${i}`}
                value={event.resourceIdPath.toString()}
                onChange={(detail: GoabInputOnChangeDetail) => {
                  const existingTarget = JSON.parse(JSON.stringify(target));
                  const splitPath = detail.value.split(',').map((item) => item.trim());
                  if (splitPath.length < 2) {
                    existingTarget.invalidationEvents[i].resourceIdPath = detail.value;
                  } else {
                    existingTarget.invalidationEvents[i].resourceIdPath = splitPath;
                  }
                  setTarget(existingTarget);
                }}
                width="100%"
              />
            </MbS>
          ))}
        </div>
      </div>
    </GoabModal>
  );
};
