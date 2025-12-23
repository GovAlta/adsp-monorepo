import React, { useState, useEffect } from 'react';
import { GoabButton, GoabButtonGroup, GoabInput, GoabModal, GoabFormItem } from '@abgov/react-components';
import { Service } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { createEntry, updateEntry, fetchEntryDetail } from '@store/directory/actions';
import { RootState } from '@store/index';
import {
  characterCheck,
  validationPattern,
  Validator,
  isNotEmptyCheck,
  wordMaxLengthCheck,
} from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { EditModalType, AddModalType } from '@store/directory/models';
import { selectModalStateByType } from '@store/session/selectors';
import { ResetModalState } from '@store/session/actions';
import { selectEditAddDirectory } from '@store/directory/selectors';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
} from '@abgov/ui-components-common';

const duplicateServiceCheck = (directory: Service[], tenantName: string, isNew: boolean): Validator => {
  return (input: Service) => {
    // If we don't have an API, check that the service is not duplicated.
    if (!input.api) {
      // If we're editing then the service name will already be in the directory; remove it for duplicate check.
      const dir = isNew ? directory : directory.slice(0).filter((e) => e.service === input.service);
      const duplicate = dir.find((s) => !s.api && s.namespace === tenantName && s.service === input.service);
      return duplicate ? 'Service duplicate, please use another' : '';
    }
  };
};

const duplicateApiCheck = (directory: Service[], tenantName: string, isNew: boolean): Validator => {
  return (input: Service) => {
    // If we have an API check that it is not a duplicate for the service.
    if (input.api) {
      // If we're editing then the api name will already be in the directory; remove it for duplicate check.
      const dir = isNew
        ? directory
        : directory.slice(0).filter((e) => e.api !== input.api && e.service === input.service);
      const duplicate = dir.find(
        (s) => s.namespace === tenantName && s.service === input.service && s.api === input.api
      );
      return duplicate ? 'Api duplicate, please use another' : '';
    }
  };
};

const lowerCaseCheck = characterCheck(validationPattern.lowerKebabCase);
const checkForBadUrl = characterCheck(validationPattern.validURL);
const checkServiceExists = isNotEmptyCheck('service');
const checkUrlExists = isNotEmptyCheck('URL');
const wordLengthCheck = wordMaxLengthCheck(32, 'name');

export const DirectoryModal = (): JSX.Element => {
  const editModal = useSelector(selectModalStateByType(EditModalType));
  const addModal = useSelector(selectModalStateByType(AddModalType));
  const initEntry = useSelector(selectEditAddDirectory) as unknown as Service;
  const [entry, setEntry] = useState<Service>(initEntry);
  const isNew = addModal?.isOpen && addModal?.id === null;
  const isQuickAdd = addModal?.isOpen && addModal?.id !== null;
  const isEdit = editModal?.isOpen;

  const title = isNew || isQuickAdd ? 'Add entry' : 'Edit entry';
  const { directory } = useSelector((state: RootState) => state.directory);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const dispatch = useDispatch();
  const { errors, validators } = useValidators(
    'service',
    'service',
    lowerCaseCheck,
    checkServiceExists,
    wordLengthCheck
  )
    .add('api', 'api', lowerCaseCheck)
    .add('url', 'url', checkForBadUrl, checkUrlExists)
    .add('apiDuplicate', 'api', duplicateApiCheck(directory, tenantName, isNew))
    .add('serviceDuplicate', 'service', duplicateServiceCheck(directory, tenantName, isNew))
    .build();

  // eslint-disable-next-line
  useEffect(() => {
    setEntry(initEntry);
  }, [isNew, isQuickAdd, isEdit, initEntry]);

  return (
    <GoabModal
      testId="directory-modal"
      open={isNew || isEdit || isQuickAdd}
      heading={title}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="directory-modal-cancel"
            onClick={() => {
              validators.clear();
              dispatch(ResetModalState());
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            disabled={!entry.service || !entry.url || validators.haveErrors()}
            testId="directory-modal-save"
            onClick={() => {
              const validations = {
                serviceDuplicate: entry,
                apiDuplicate: entry,
              };

              if (!isEdit && !validators.checkAll(validations)) {
                return;
              }

              if (isNew) {
                dispatch(createEntry(entry));
                if (!entry.api) {
                  const fetchTime = setInterval(() => dispatch(fetchEntryDetail(entry)), 1000);
                  setTimeout(() => {
                    clearInterval(fetchTime);
                  }, 1000);
                }
              }
              if (isQuickAdd) {
                dispatch(createEntry(entry));
              }
              if (isEdit) {
                dispatch(updateEntry(entry));
              }

              dispatch(ResetModalState());
            }}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem error={errors?.['service']} label="Service">
        <GoabInput
          type="text"
          name="service"
          width="100%"
          value={entry.service}
          testId={`directory-modal-service-input`}
          aria-label="service"
          disabled={!isNew || isQuickAdd}
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators['service'].check(detail.value);
            setEntry({ ...entry, service: detail.value });
          }}
        />
      </GoabFormItem>
      <GoabFormItem error={errors?.['api']} label="API">
        <GoabInput
          type="text"
          name="api"
          width="100%"
          value={entry.api}
          testId={`directory-modal-api-input`}
          aria-label="api"
          disabled={!isNew || isQuickAdd}
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators['api'].check(detail.value);
            setEntry({ ...entry, api: detail.value });
          }}
        />
      </GoabFormItem>
      <GoabFormItem error={errors?.['url']} label="URL">
        <GoabInput
          type="url"
          name="url"
          width="100%"
          value={entry.url}
          testId={`directory-modal-url-input`}
          aria-label="name"
          disabled={isQuickAdd}
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators['url'].check(detail.value);
            setEntry({ ...entry, url: detail.value });
          }}
        />
      </GoabFormItem>
    </GoabModal>
  );
};
