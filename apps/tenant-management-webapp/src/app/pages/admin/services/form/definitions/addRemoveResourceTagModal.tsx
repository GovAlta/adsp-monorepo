import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDebounce } from '@lib/useDebounce';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { GoAInput, GoAModal, GoAButtonGroup, GoAFormItem, GoAButton, GoAChip } from '@abgov/react-components-new';
import { FormDefinition } from '@store/form/model';
import { Resource, ResourceTag, ResourceTagResult } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResourceTags, FetchResourceTagsAction, unTagResource } from '@store/directory/actions';
import { RootState } from '@store/index';

interface AddRemoveResourceTagModalProps {
  baseUrn: string;
  open: boolean;
  isAdd: boolean;
  initialFormDefinition?: FormDefinition;
  onClose: () => void;
  onDelete: (tag: ResourceTagResult) => void;
  onSave: (tag: ResourceTag) => void;
}

const TagsChipComponent: FunctionComponent<{
  tag?: ResourceTagResult;
  onDelete(tag: ResourceTagResult): void;
}> = ({ tag, onDelete, currentDefinition, baseUrn }) => {
  return (
    <GoAChip
      content={tag.label}
      deletable={true}
      onClick={() => {
        onDelete(tag);
      }}
      mr="xs"
      mb="xs"
    />
  );
};

export const AddRemoveResourceTagModal: FunctionComponent<AddRemoveResourceTagModalProps> = ({
  isAdd,
  initialFormDefinition,
  baseUrn,
  onClose,
  open,
  onSave,
  onDelete,
}) => {
  const dispatch = useDispatch();
  const [tag, setTag] = useState<string>('');

  const [saveButtonText, setSaveButtonText] = useState<string>('Add tag');
  const debouncedTag = useDebounce(tag, 500);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const mappedTags = useSelector((state: RootState) => {
    return state?.directory?.resourceTags;
  });

  useEffect(() => {
    setTag('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (baseUrn && initialFormDefinition.id.length > 0) {
      dispatch(fetchResourceTags(`${baseUrn}/${initialFormDefinition.id}`));
    }
  }, [baseUrn, dispatch, initialFormDefinition]);

  const { errors, validators } = useValidators(
    'name',
    'name',
    wordMaxLengthCheck(50, 'Tag'),
    isNotEmptyCheck('Tag'),
    badCharsCheck
  )
    // .add('duplicate', 'name', duplicateNameCheck(templateIds, 'template'))

    .build();
  return (
    <GoAModal
      testId="add-resource-tag-model"
      open={open}
      heading={`${isAdd ? 'Add' : 'Edit'} tags`}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId={`add-resource-tag-name-cancel-${isAdd ? 'Add' : 'Edit'}`}
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
            testId="resource-tag-save"
            disabled={tag.length === 0 ? true : false}
            onClick={() => {
              onSave({ label: tag, urn: `${baseUrn}/${initialFormDefinition.id}` } as ResourceTag);
              onClose();
            }}
          >
            {saveButtonText}
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors['name']} label="Tag" mb={'m'} requirement="required">
        <GoAInput
          type="text"
          name="add-resource-tag-name"
          value={tag}
          testId="add-resource-tag-name"
          aria-label="add-resource-tag-name"
          width="100%"
          onChange={(name, value) => {
            validators.remove('name');
            const validations = {
              name: value,
            };

            validators.checkAll(validations);
            setTag(value.trim());
          }}
        />
      </GoAFormItem>

      {mappedTags
        ?.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
        .map((tag) => (
          <TagsChipComponent key={tag.value} tag={tag} onDelete={onDelete} />
        ))}
    </GoAModal>
  );
};
