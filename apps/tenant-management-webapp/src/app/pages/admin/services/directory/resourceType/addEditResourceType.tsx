import React, { useState, useEffect } from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabModal,
  GoabInput,
  GoabFormItem,
  GoabDropdown,
  GoabDropdownItem,
} from '@abgov/react-components';

import { useSelector, useDispatch } from 'react-redux';

import { isNotEmptyCheck, isValidRegexString } from '@lib/validation/checkInput';

import { fetchDirectory } from '@store/directory/actions';

import { defaultResourceType, ResourceType } from '@store/directory/models';
import { selectSortedDirectory } from '@store/directory/selectors';
import { getEventDefinitions } from '@store/event/actions';
import { selectFilteredEventDefinitions } from '@store/event/selectors';

import { useValidators } from '@lib/validation/useValidators';
import { areObjectsEqual } from '@lib/objectUtil';
import { GoabInputOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';

interface ResourceTypeModalProps {
  open: boolean;
  isEdit: boolean;
  initialType: ResourceType;
  urn: string;
  initialDeleteEvent: string;
  onCancel?: () => void;
  onSave: (resourceType: ResourceType, urnStr) => void;
}

export const AddEditResourceTypeModal = ({
  initialType,
  urn,
  initialDeleteEvent,
  onCancel,
  onSave,
  open,
  isEdit,
}: ResourceTypeModalProps): JSX.Element => {
  const [resourceType, setResourceType] = useState<ResourceType>(initialType);
  const [api, setApi] = useState('');
  const [selectedDeleteEvent, setSelectedDeleteEvent] = useState('');
  useEffect(() => {
    setResourceType(initialType);
    setApi(urn);
    setSelectedDeleteEvent(initialDeleteEvent);
  }, [initialType, urn, initialDeleteEvent]);

  const dispatch = useDispatch();
  const { tenantDirectory } = useSelector(selectSortedDirectory);
  const filteredEventDefinitions = useSelector(selectFilteredEventDefinitions);

  const { errors, validators } = useValidators('name', 'name', isNotEmptyCheck('name'))
    .add('api', 'api', isNotEmptyCheck('api'))
    .add('type', 'type', isNotEmptyCheck('type'))
    .add('matcher', 'matcher', isNotEmptyCheck('matcher'))
    .add('matcher', 'matcher', isValidRegexString('matcher'))
    .build();

  const resetForm = () => {
    validators.clear();
    setResourceType(defaultResourceType);
    setSelectedDeleteEvent('');
    setApi('');
  };

  const onCancelModal = () => {
    resetForm();
    onCancel?.();
  };

  const handleSave = () => {
    const validations = {
      type: resourceType?.type,
      matcher: resourceType?.matcher,
      api: api,
    };

    if (!validators.checkAll(validations)) {
      return;
    }
    onSave(resourceType, api);
    onCancelModal();
  };

  useEffect(() => {
    dispatch(fetchDirectory());
    dispatch(getEventDefinitions());
  }, [dispatch]);

  return (
    <GoabModal
      testId="add-edit-resource-type-modal"
      open={open}
      heading={`${isEdit ? 'Edit' : 'New'} resource type`}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" testId="resource-type-modal-cancel" onClick={onCancelModal}>
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="resource-type-modal-save"
            disabled={
              validators.haveErrors() ||
              areObjectsEqual(resourceType, defaultResourceType) ||
              resourceType?.type.length === 0 ||
              resourceType?.matcher.length === 0
            }
            onClick={handleSave}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem label="Api" requirement="required" error={errors?.['api']}>
        <GoabDropdown
          name="api"
          value={isEdit ? urn : api}
          aria-label="resource-type-api"
          width="100%"
          testId="resource-type-api"
          disabled={isEdit}
          onChange={(detail: GoabDropdownOnChangeDetail) => {
            validators.remove('api');
            validators['api'].check(detail.value);

            setApi(detail.value);
            setResourceType({
              ...resourceType,
              deleteEvent: {
                ...resourceType.deleteEvent,
                resourceIdPath: detail.value,
              },
            });
          }}
        >
          {tenantDirectory &&
            tenantDirectory.length > 0 &&
            tenantDirectory.map((state, key) => <GoabDropdownItem key={key} value={state.urn} label={state.urn} />)}
        </GoabDropdown>
      </GoabFormItem>
      <br />
      <GoabFormItem label="Type" error={errors?.['type']} requirement="required">
        <GoabInput
          type="text"
          name="type"
          value={resourceType?.type}
          testId={`resource-type-modal-type-input`}
          width="100%"
          aria-label="type"
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators.remove('type');
            validators['type'].check(detail.value);
            setResourceType({ ...resourceType, type: detail.value });
          }}
        />
      </GoabFormItem>
      <br />
      <GoabFormItem label="Matcher" error={errors?.['matcher']} requirement="required">
        <GoabInput
          type="text"
          name="matcher"
          value={resourceType?.matcher}
          testId={`resource-type-modal-matcher-input`}
          width="100%"
          aria-label="matcher"
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators.remove('matcher');
            validators['matcher'].check(detail.value);
            setResourceType({ ...resourceType, matcher: detail.value });
          }}
        />
      </GoabFormItem>
      <br />
      <GoabFormItem
        label="Name path"
        helpText="Path to a property on the API GET response for the resource which represents its name"
      >
        <GoabInput
          type="text"
          name="name_path"
          value={resourceType?.namePath}
          testId={`resource-type-modal-name-path-input`}
          width="100%"
          aria-label="name path"
          onChange={(detail: GoabInputOnChangeDetail) => {
            setResourceType({ ...resourceType, namePath: detail.value });
          }}
        />
      </GoabFormItem>
      <br />
      <GoabFormItem label="Delete event">
        <GoabDropdown
          name="resource-type-event-definitions"
          value={isEdit ? initialDeleteEvent : selectedDeleteEvent}
          aria-label="resource-type-form-dropdown"
          width="100%"
          testId="resource-type-event-dropdown"
          mt="s"
          mb="4xl"
          onChange={(detail: GoabDropdownOnChangeDetail) => {
            if (detail.value && detail.value.indexOf(':') > -1) {
              setSelectedDeleteEvent(detail.value);
              setResourceType({
                ...resourceType,
                deleteEvent: {
                  ...resourceType.deleteEvent,
                  namespace: detail.value.split(':')[0],
                  name: detail.value.split(':')[1],
                },
              });
            }
          }}
        >
          {filteredEventDefinitions &&
            Object.keys(filteredEventDefinitions).map((item, key) => (
              <GoabDropdownItem key={key} label={item} value={item} />
            ))}
        </GoabDropdown>
      </GoabFormItem>
    </GoabModal>
  );
};
