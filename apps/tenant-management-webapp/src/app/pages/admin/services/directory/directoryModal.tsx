import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { Service } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { createEntry, updateEntry } from '@store/directory/actions';
import { RootState } from '@store/index';

interface DirectoryModalProps {
  entry?: Service;
  type: 'new' | 'edit';
  onCancel?: () => void;
  open: boolean;
}

export const DirectoryModal = (props: DirectoryModalProps): JSX.Element => {
  const isNew = props.type === 'new';
  const [entry, setEntry] = useState(props.entry);

  const title = isNew ? 'Add entry' : 'Edit entry';
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { directory } = useSelector((state: RootState) => state.directory);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const dispatch = useDispatch();

  const checkService = (entry) => {
    return directory.find((x) => !x.api && x.namespace === tenantName && x.service === entry.service);
  };

  const checkApi = (entry) => {
    const hasExist = directory.find(
      (x) => x.namespace === tenantName && x.service === entry.service && x.api === entry.api
    );

    if (!isNew && hasExist && hasExist.service === props.entry.service && hasExist.api === props.entry.api) {
      return false;
    }

    return hasExist;
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
              onChange={(e) => setEntry({ ...entry, service: e.target.value })}
              aria-label="service"
              maxLength={50}
              disabled={!isNew}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['api']}>
            <label>API</label>
            <input
              type="text"
              name="api"
              value={entry.api}
              data-testid={`directory-modal-api-input`}
              onChange={(e) => setEntry({ ...entry, api: e.target.value })}
              aria-label="api"
              maxLength={50}
              disabled={!isNew}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['url']}>
            <label>URL</label>
            <input
              type="url"
              name="url"
              value={entry.url}
              data-testid={`directory-modal-url-input`}
              onChange={(e) => setEntry({ ...entry, url: e.target.value })}
              aria-label="name"
              maxLength={1024}
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
          disabled={!entry.service || !entry.url}
          data-testid="directory-modal-save"
          onClick={() => {
            const regex = new RegExp(/^[a-z0-9-]+$/);

            if (!regex.test(entry.service)) {
              setErrors({ ...errors, service: 'Service allowed characters: a-z, 0-9, -' });
              return;
            }
            if (entry.api && !regex.test(entry.api)) {
              setErrors({ ...errors, api: 'Api allowed characters: a-z, 0-9, -' });
              return;
            }
            const urlReg = new RegExp(/^(http|https):\/\/[^ "]+$/);

            if (!urlReg.test(entry.url)) {
              setErrors({ ...errors, url: 'Please input right url format' });
              return;
            }

            if (entry.api && checkApi(entry) && isNew) {
              setErrors({ ...errors, api: 'Api duplicate, please use another one' });
              return;
            }

            if ((!entry.api || entry.api === '') && checkService(entry) && isNew) {
              setErrors({ ...errors, service: 'Service duplicate, please use another one' });
              return;
            }
            if (props.type === 'new') {
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
