import React, { useState, useEffect } from 'react';
import { CacheTarget } from '@store/cache/model';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { defaultCacheTarget } from '@store/cache/model';
import { fetchDirectory } from '@store/directory/actions';
import { selectSortedDirectory } from '@store/directory/selectors';
import { GoADropdownItem, GoADropdown } from '@abgov/react-components';

import { GoAInput, GoAModal, GoAButtonGroup, GoAFormItem, GoAButton } from '@abgov/react-components';

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
  const initialTarget = isEdit ? currentValue : defaultCacheTarget;
  const [target, setTarget] = useState<CacheTarget>(initialTarget);

  const dispatch = useDispatch();

  const { tenantDirectory, coreDirectory } = useSelector(selectSortedDirectory);

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

  useEffect(() => {
    setTarget(initialTarget);
  }, [open, initialTarget]);

  const { errors, validators } = useValidators('urn', 'urn', isNotEmptyCheck('urn'))
    .add('duplicate', 'urn', duplicateNameCheck(definitionIds, 'urn'))
    .build();

  return (
    <GoAModal
      testId="cache-target-modal"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} target`}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="add-edit-target-cancel"
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
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
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <div style={{ height: '360px' }}>
        <GoAFormItem error={errors?.['urn']} label="Target" mb="3" mt="3">
          <GoADropdown
            relative={true}
            name="target"
            testId="target"
            width="100%"
            disabled={isEdit}
            value={target.urn}
            onChange={(_, value: string) => {
              validators.clear();
              setTarget({ ...target, urn: value });
            }}
          >
            {tenantDirectory.map((directory) => (
              <GoADropdownItem value={directory.urn} label={directory.urn} />
            ))}
          </GoADropdown>
        </GoAFormItem>

        <GoAFormItem label="Url" mb="5" mt="5">
          <GoAInput
            name="target-url"
            testId="target-url"
            width="100%"
            disabled={true}
            value={tenantDirectory.find((directory) => directory.urn === target.urn)?.url}
          />
        </GoAFormItem>

        <GoAFormItem error={errors?.['formDraftUrlTemplate']} label="TTL" mb="3" mt="3">
          <GoAInput
            name="target-ttl-seconds"
            type="number"
            min="0"
            max="2000000000"
            step={1}
            value={target?.ttl?.toString()}
            testId="target-ttl-seconds"
            width="100%"
            onChange={(name, value) => {
              const cleanedValue = value.replace(/[e.-]/g, '');
              setTarget({ ...target, ttl: Math.min(parseInt(cleanedValue) || 0, 2000000000) });
            }}
            trailingContent="seconds"
          />
        </GoAFormItem>
      </div>
    </GoAModal>
  );
};
