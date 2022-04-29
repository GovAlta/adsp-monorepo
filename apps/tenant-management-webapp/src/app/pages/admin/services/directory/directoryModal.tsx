import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { Service } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { createEntry, updateEntry, fetchEntryDetail } from '@store/directory/actions';
import { RootState } from '@store/index';
import {
  ReactCleansingReporter,
  characterCleanser,
  cleansingPatterns,
  checkInput,
  Cleanser,
  isNotEmptyCheck,
} from '@lib/checkInput';

interface DirectoryModalProps {
  entry?: Service;
  type: string;
  onCancel?: () => void;
  open: boolean;
}
const duplicateServiceCheck = (directory: Service[], tenantName: string): Cleanser => {
  return (input: string) => {
    const duplicate = directory.find((s) => !s.api && s.namespace === tenantName && s.service === input);
    return duplicate ? 'Service duplicate, please use another' : '';
  };
};

const duplicateApiCheck = (directory: Service[], tenantName: string): Cleanser => {
  return (input: Service) => {
    const duplicate = directory.find(
      (s) => s.namespace === tenantName && s.service === input.service && s.api === input.api
    );
    return duplicate ? 'Api duplicate, please use another' : '';
  };
};

const lowerCaseCheck = characterCleanser(cleansingPatterns.alphanumericLC);
const checkForBadUrl = characterCleanser(cleansingPatterns.urlCharacters);
const checkServiceExists = isNotEmptyCheck('service');
const checkUrlExists = isNotEmptyCheck('URL');

export const DirectoryModal = (props: DirectoryModalProps): JSX.Element => {
  const isNew = props.type === 'new';
  const isQuickAdd = props.type === 'quickAdd';
  const [entry, setEntry] = useState(props.entry);

  const title = isNew || isQuickAdd ? 'Add entry' : 'Edit entry';
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { directory } = useSelector((state: RootState) => state.directory);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const dispatch = useDispatch();
  const reporter = new ReactCleansingReporter(errors, setErrors);
  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };

  const duplicateExists = (entry: Service): boolean => {
    // If we have an API check that it is not a duplicate for the service.
    if (entry.api) {
      // If we're editing then the api name will already be in the directory; remove it for duplicate check.
      const dir = isNew
        ? directory
        : directory.slice(0).filter((e) => e.api !== entry.api && e.service === entry.service);
      if (checkInput(entry, [duplicateApiCheck(dir, tenantName)], reporter, 'api')) {
        return true;
      }
    }
    // If we don't have an API, check that the service is not duplicated.
    else {
      // If we're editing then the service name will already be in the directory; remove it for duplicate check.
      const dir = isNew ? directory : directory.slice(0).filter((e) => e.service === entry.service);
      if (checkInput(entry.service, [duplicateServiceCheck(dir, tenantName)], reporter, 'service')) {
        return true;
      }
    }
    return false;
  };

  return (
    <GoAModal testId="directory-modal" isOpen={props.open}>
      <GoAModalTitle>{title}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['service']}>
            <label>Service</label>
            <input
              type="text"
              name="service"
              value={entry.service}
              data-testid={`directory-modal-service-input`}
              aria-label="service"
              maxLength={50}
              disabled={!isNew || isQuickAdd}
              onChange={(e) => {
                checkInput(e.target.value, [lowerCaseCheck, checkServiceExists], reporter, 'service');
                setEntry({ ...entry, service: e.target.value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['api']}>
            <label>API</label>
            <input
              type="text"
              name="api"
              value={entry.api}
              data-testid={`directory-modal-api-input`}
              aria-label="api"
              maxLength={50}
              disabled={!isNew || isQuickAdd}
              onChange={(e) => {
                checkInput(e.target.value, [lowerCaseCheck], reporter, 'api');
                setEntry({ ...entry, api: e.target.value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['url']}>
            <label>URL</label>
            <input
              type="url"
              name="url"
              value={entry.url}
              data-testid={`directory-modal-url-input`}
              aria-label="name"
              maxLength={1024}
              disabled={isQuickAdd}
              onChange={(e) => {
                checkInput(e.target.value, [checkForBadUrl, checkUrlExists], reporter, 'url');
                setEntry({ ...entry, url: e.target.value });
              }}
            />
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="secondary"
          data-testid="directory-modal-cancel"
          onClick={() => {
            props.onCancel();
            setErrors({});
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          buttonType="primary"
          disabled={!entry.service || !entry.url || hasFormErrors()}
          data-testid="directory-modal-save"
          onClick={(e) => {
            if (duplicateExists(entry)) {
              e.stopPropagation();
              return;
            }
            if (isNew) {
              dispatch(createEntry(entry));
              dispatch(fetchEntryDetail(entry));
            }
            if (isQuickAdd) {
              dispatch(createEntry(entry));
            }
            if (props.type === 'edit') {
              dispatch(updateEntry(entry));
            }

            props.onCancel();
          }}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
