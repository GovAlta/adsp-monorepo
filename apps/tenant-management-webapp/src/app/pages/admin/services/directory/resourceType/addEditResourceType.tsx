import React, { useState, useEffect } from 'react';
import {
  GoAButton,
  GoAButtonGroup,
  GoAModal,
  GoAInput,
  GoAFormItem,
  GoADropdown,
  GoADropdownItem,
} from '@abgov/react-components';

import { useSelector, useDispatch } from 'react-redux';

import { isNotEmptyCheck } from '@lib/validation/checkInput';

import { fetchDirectory } from '@store/directory/actions';

import { defaultResourceType, ResourceType } from '@store/directory/models';
import { selectSortedDirectory } from '@store/directory/selectors';
import { getEventDefinitions } from '@store/event/actions';
import { selectFilteredEventDefinitions } from '@store/event/selectors';

import { useValidators } from '@lib/validation/useValidators';
import { areObjectsEqual } from '@lib/objectUtil';

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
  const [urnStr, setUrnStr] = useState('');
  const [selectedDeleteEvent, setSelectedDeleteEvent] = useState('');
  useEffect(() => {
    setResourceType(initialType);
    setUrnStr(urn);
    setSelectedDeleteEvent(initialDeleteEvent);
  }, [initialType, urn, initialDeleteEvent]);

  const dispatch = useDispatch();
  const { tenantDirectory } = useSelector(selectSortedDirectory);
  const filteredEventDefinitions = useSelector(selectFilteredEventDefinitions);

  const { errors, validators } = useValidators('name', 'name', isNotEmptyCheck('name'))
    .add('duplicated', 'name', isNotEmptyCheck('name'))
    .add('type', 'type', isNotEmptyCheck('type'))
    .add('matcher', 'matcher', isNotEmptyCheck('matcher'))

    .build();

  const resetForm = () => {
    validators.clear();
    setResourceType(defaultResourceType);
    setSelectedDeleteEvent('');
    setUrnStr('');
  };

  const onCancelModal = () => {
    resetForm();
    onCancel?.();
  };

  const handleSave = () => {
    const validations = {
      type: resourceType?.type,
      matcher: resourceType?.matcher,
    };

    if (!validators.checkAll(validations)) {
      return;
    }
    onSave(resourceType, urnStr);
    onCancelModal();
  };

  useEffect(() => {
    dispatch(fetchDirectory());
    dispatch(getEventDefinitions());
  }, [dispatch]);

  return (
    <GoAModal
      testId="add-edit-resource-type-modal"
      open={open}
      heading={`${isEdit ? 'Edit' : 'New'} resource type`}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" testId="resource-type-modal-cancel" onClick={onCancelModal}>
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="resource-type-modal-save"
            disabled={
              validators.haveErrors() &&
              areObjectsEqual(resourceType, defaultResourceType) &&
              resourceType?.type.length > 0 &&
              resourceType?.matcher.length > 0
            }
            onClick={handleSave}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem label="Api" requirement="required">
        <GoADropdown
          name="resource-type-api"
          value={isEdit ? urn : urnStr}
          aria-label="resource-type-api"
          width="100%"
          testId="resource-type-api"
          disabled={isEdit}
          onChange={(_, value: string) => {
            setUrnStr(value);
            setResourceType({
              ...resourceType,
              deleteEvent: {
                ...resourceType.deleteEvent,
                resourceIdPath: value,
              },
            });
          }}
          relative={true}
        >
          {tenantDirectory &&
            tenantDirectory.length > 0 &&
            tenantDirectory.map((state, key) => <GoADropdownItem key={key} value={state.urn} label={state.urn} />)}
        </GoADropdown>
      </GoAFormItem>
      <br />
      <GoAFormItem label="Type" error={errors?.['type']} requirement="required">
        <GoAInput
          type="text"
          name="type"
          value={resourceType?.type}
          testId={`resource-type-modal-type-input`}
          width="100%"
          aria-label="type"
          onChange={(name, value) => {
            setResourceType({ ...resourceType, type: value });
          }}
        />
      </GoAFormItem>
      <br />
      <GoAFormItem label="Matcher" error={errors?.['matcher']} requirement="required">
        <GoAInput
          type="text"
          name="matcher"
          value={resourceType?.matcher}
          testId={`resource-type-modal-matcher-input`}
          width="100%"
          aria-label="matcher"
          onChange={(name, value) => {
            setResourceType({ ...resourceType, matcher: value });
          }}
        />
      </GoAFormItem>
      <br />
      <GoAFormItem
        label="Name path"
        helpText="Path to a property on the API GET response for the resource which represents its name"
      >
        <GoAInput
          type="text"
          name="name_path"
          value={resourceType?.namePath}
          testId={`resource-type-modal-name-path-input`}
          width="100%"
          aria-label="name path"
          onChange={(name, value) => {
            setResourceType({ ...resourceType, namePath: value });
          }}
        />
      </GoAFormItem>
      <br />
      <GoAFormItem label="Delete event">
        <GoADropdown
          name="resource-type-event-definitions"
          value={isEdit ? initialDeleteEvent : selectedDeleteEvent}
          aria-label="resource-type-form-dropdown"
          width="100%"
          testId="resource-type-event-dropdown"
          relative={true}
          mt="s"
          mb="4xl"
          onChange={(_, value: string) => {
            if (value.indexOf(':') > -1) {
              setSelectedDeleteEvent(value);
              setResourceType({
                ...resourceType,
                deleteEvent: {
                  ...resourceType.deleteEvent,
                  namespace: value.split(':')[0],
                  name: value.split(':')[1],
                },
              });
            }
          }}
        >
          {filteredEventDefinitions &&
            Object.keys(filteredEventDefinitions).map((item, key) => (
              <GoADropdownItem key={key} label={item} value={item} />
            ))}
        </GoADropdown>
      </GoAFormItem>
    </GoAModal>
  );
};
