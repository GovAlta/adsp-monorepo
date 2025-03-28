import React, { useState, useEffect } from 'react';
import { CacheTarget } from '@store/cache/model';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDirectory } from '@store/directory/actions';
import { selectSortedDirectory } from '@store/directory/selectors';
import { GoADropdownItem, GoADropdown } from '@abgov/react-components';

import {
  GoATextArea,
  GoAInput,
  GoAModal,
  GoAButtonGroup,
  GoAFormItem,
  GoAButton,
  GoAIcon,
  GoACheckbox,
} from '@abgov/react-components';
import { Directory } from '../directory';
import { Targets } from './targets';

interface AddEditTargetCacheProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: CacheTarget;
  onClose: () => void;
  onSave: (target: CacheTarget) => void;
}

export const AddEditTargetCache = ({
  initialValue,
  isEdit,
  onClose,
  open,
  onSave,
}: AddEditTargetCacheProps): JSX.Element => {
  const [target, setTarget] = useState<CacheTarget>(initialValue);
  // const [spinner, setSpinner] = useState<boolean>(false);

  const dispatch = useDispatch();

  const { tenantDirectory, coreDirectory } = useSelector(selectSortedDirectory);

  const targets = useSelector((state: RootState) => {
    return state.cache?.targets;
  });

  const definitionIds = [
    ...Object.values(targets.core).map((x) => x.urn),
    ...Object.values(targets.tenant).map((x) => x.urn),
  ];
  //const definitionIds = Object.values().map((x) => x.urn);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const combinedDirectory = [...tenantDirectory, ...coreDirectory];

  useEffect(() => {
    if (Object.keys(targets).length > 0 && !isEdit) {
      if (validators['duplicate'].check(target.urn)) {
        // setSpinner(false);
        onClose();
      }
    }
  }, [targets]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchDirectory());
  }, [dispatch]);

  useEffect(() => {
    setTarget(initialValue);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
              if (indicator.show === true) {
                // setSpinner(true);
              } else {
                if (!isEdit) {
                  const validations = {
                    duplicate: target.urn,
                  };
                  if (!validators.checkAll(validations)) {
                    return;
                  }
                }
                // setSpinner(true);

                onSave(target);
              }
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <div style={{ height: '360px' }}>
        <GoAFormItem error={errors?.['urn']} label="URN" mb="3" mt="3">
          <GoADropdown
            relative={true}
            name="cache-status"
            width="100%"
            value={target.urn}
            onChange={(_, value: string) => {
              validators.clear();
              setTarget({ ...target, urn: value });
            }}
          >
            {combinedDirectory.map((directory) => (
              <GoADropdownItem value={directory.urn} label={directory.urn} />
            ))}
            <GoADropdownItem label="qqq" value="qqq" />
          </GoADropdown>
        </GoAFormItem>

        <GoAFormItem label="Url" mb="5" mt="5">
          <GoAInput
            name="cache-url"
            width="100%"
            disabled={true}
            value={combinedDirectory.find((directory) => directory.urn === target.urn)?.url}
          />

          {/* <pre>{JSON.stringify(coreDirectory, null, 2)}</pre> */}
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
