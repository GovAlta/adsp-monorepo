import React, { FunctionComponent, useState, useEffect, useMemo } from 'react';
import { debounce as _debounce } from 'lodash';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';

import {
  GoabInput,
  GoabModal,
  GoabButtonGroup,
  GoabFormItem,
  GoabButton,
  GoabFilterChip,
  GoabSkeleton,
} from '@abgov/react-components';
import { FormDefinition, FormResourceTagResult } from '@store/form/model';
import { ResourceTag } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchFormResourceTags, fetchFormTagByTagName } from '@store/form/action';
import { AddRemoveResourceTagSpacing } from './style-components';
import { selectFormResourceTags } from '@store/form/selectors';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface AddRemoveResourceTagModalProps {
  baseResourceFormUrn: string;
  open: boolean;
  initialFormDefinition?: FormDefinition;
  onClose: () => void;
  onDelete: (tag: FormResourceTagResult) => void;
  onSave: (tag: ResourceTag, isTagAdded: boolean) => void;
}

const TagChipComponent: FunctionComponent<{
  tag?: FormResourceTagResult;
  onDelete(tag: FormResourceTagResult);
}> = ({ tag, onDelete }) => {
  return (
    <GoabFilterChip
      testId={`tag-label-${tag.label}`}
      content={tag.label}
      onClick={() => {
        onDelete(tag);
      }}
      mr="xs"
      mb="xs"
    />
  );
};

export const AddRemoveResourceTagModal: FunctionComponent<AddRemoveResourceTagModalProps> = ({
  initialFormDefinition,
  baseResourceFormUrn,
  onClose,
  open,
  onSave,
  onDelete,
}) => {
  const dispatch = useDispatch();
  const [tag, setTag] = useState<string>('');

  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(true);
  const MAX_TAG_LENGTH = 50;

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const resourceTags = useSelector((state: RootState) => selectFormResourceTags(state, initialFormDefinition?.id));

  const searchedTagExists = useSelector((state: RootState) => {
    return state?.form?.formResourceTag?.searchedTagExists;
  });

  const tagAlreadyAdded = () => {
    return (
      resourceTags?.filter((toFindTag) => {
        return toFindTag.label.toLowerCase() === tag.toLowerCase();
      })?.length > 0
    );
  };

  const debouncedChangeHandler = useMemo(
    () =>
      _debounce(
        async (input) => {
          dispatch(fetchFormTagByTagName(toKebabName(input.toLowerCase())));
          setTag(input);
        },
        800,
        { leading: false, trailing: true }
      ),
    [dispatch]
  );

  useEffect(() => {
    setTag('');
    setIsFetchLoading(true);
  }, [open]);

  useEffect(() => {
    return () => {
      debouncedChangeHandler.cancel();
    };
  }, [debouncedChangeHandler]);

  useEffect(() => {
    if (baseResourceFormUrn && initialFormDefinition.id.length > 0 && resourceTags === undefined) {
      dispatch(fetchFormResourceTags(`${baseResourceFormUrn}/${initialFormDefinition.id}`));
    }
  }, [baseResourceFormUrn, dispatch, initialFormDefinition, resourceTags]);

  const { errors, validators } = useValidators(
    'name',
    'name',
    wordMaxLengthCheck(MAX_TAG_LENGTH, 'Tag'),
    isNotEmptyCheck('Tag'),
    badCharsCheck
  ).build();

  const isNotValid = () => {
    if (tag.length === 0) return true;

    if (validators.haveErrors()) return true;

    if (tagAlreadyAdded()) return true;

    return false;
  };
  return (
    <GoabModal
      testId="add-resource-tag-model"
      open={open}
      heading={`Add tags`}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            testId={`add-resource-tag-name-cancel`}
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Close
          </GoabButton>
          <GoabButton
            type="primary"
            testId="resource-tag-save"
            disabled={isNotValid()}
            onClick={() => {
              onSave(
                {
                  label: tag.trim(),
                  urn: `${baseResourceFormUrn}/${initialFormDefinition.id}`,
                } as ResourceTag,
                tagAlreadyAdded()
              );

              onClose();
            }}
          >
            {searchedTagExists ? 'Add tag' : 'Create and add tag'}
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <AddRemoveResourceTagSpacing>
        Add a tag to "{initialFormDefinition.id}". Enter the tag label that you want to use. A new tag will be created
        if necessary.
      </AddRemoveResourceTagSpacing>
      <GoabFormItem error={errors['name']} label="Tag" mb={'m'}>
        <GoabInput
          type="text"
          name="add-resource-tag-name"
          value={tag}
          testId="add-resource-tag-name"
          aria-label="add-resource-tag-name"
          width="100%"
          maxLength={MAX_TAG_LENGTH}
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators.remove('name');
            const validations = {
              name: detail.value,
            };

            validators.checkAll(validations);
            setIsFetchLoading(false);
            if (!validators.haveErrors()) {
              debouncedChangeHandler(detail.value);
            }
          }}
        />
      </GoabFormItem>

      {indicator?.show && isFetchLoading && resourceTags === undefined ? (
        <GoabSkeleton type="text" size={'3'} testId="addResourceModal-Skeleton" key={1} />
      ) : (
        resourceTags
          ?.sort((a, b) => a.label?.toLowerCase().localeCompare(b.label?.toLowerCase()))
          .map((tag) => <TagChipComponent key={tag.value} tag={tag} onDelete={onDelete} />)
      )}
    </GoabModal>
  );
};
