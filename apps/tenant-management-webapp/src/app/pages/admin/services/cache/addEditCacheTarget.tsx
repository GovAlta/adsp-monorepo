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
      testId="target-cache"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} target`}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="add-edit-cache-cancel"
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
            testId="cache-save"
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
            name="cache-status"
            testId="cache-status"
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
            name="cache-url"
            width="100%"
            disabled={true}
            value={tenantDirectory.find((directory) => directory.urn === target.urn)?.url}
          />
        </GoAFormItem>

        <GoAFormItem error={errors?.['formDraftUrlTemplate']} label="TTL" mb="3" mt="3">
          <GoAInput
            name="cache-url-id"
            type="number"
            value={target?.ttl?.toString()}
            testId="cache-url-id"
            width="100%"
            onChange={(name, value) => {
              setTarget({ ...target, ttl: parseInt(value) });
            }}
          />
        </GoAFormItem>
      </div>
    </GoAModal>
  );
};
