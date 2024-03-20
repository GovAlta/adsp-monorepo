import React, { FunctionComponent, useState, useEffect } from 'react';
import { CommentTopicTypes } from '@store/comment/model';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { CommentCommentItem } from '../styled-components';
import { useNavigate } from 'react-router-dom-6';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { PageIndicator } from '@components/Indicator';

import { GoAInput, GoAModal, GoAButtonGroup, GoAFormItem, GoAButton } from '@abgov/react-components-new';
interface AddEditCommentTopicTypeProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: CommentTopicTypes;
  onClose: () => void;
  onSave: (topicType: CommentTopicTypes) => void;
}

export const AddEditCommentTopicType: FunctionComponent<AddEditCommentTopicTypeProps> = ({
  initialValue,
  isEdit,
  onClose,
  open,
  onSave,
}) => {
  const navigate = useNavigate();
  const [topicType, setTopicType] = useState<CommentTopicTypes>(initialValue);
  const [spinner, setSpinner] = useState<boolean>(false);

  const topicTypes = useSelector((state: RootState) => {
    return state?.comment?.topicTypes;
  });
  const coreTopicTypes = useSelector((state: RootState) => {
    return state?.comment?.core;
  });

  const allTopicTypes = { ...topicTypes, ...coreTopicTypes };

  const topicTypeNames = Object.values(allTopicTypes).map((val: CommentTopicTypes) => {
    return val.name;
  });

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    if (spinner && Object.keys(topicTypes).length > 0 && !isEdit) {
      onClose();
      navigate(`edit/${topicType.id}`, { relative: 'path' });
      setSpinner(false);
    }
  }, [topicTypes, topicType.id, spinner, navigate, isEdit, onClose]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    setTopicType(initialValue);
  }, [open, initialValue]);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(topicTypeNames, 'topicType'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();
  return (
    <GoAModal
      testId="topicType-comment"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} topic type`}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="comment-cancel"
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
            testId="comment-save"
            disabled={!topicType.name || validators.haveErrors()}
            onClick={() => {
              if (indicator.show === true) {
                setSpinner(true);
              } else {
                if (!isEdit) {
                  const validations = {
                    duplicate: topicType.name,
                  };
                  if (!validators.checkAll(validations)) {
                    return;
                  }
                }
                setSpinner(true);
                onSave(topicType);
                if (isEdit) {
                  onClose();
                }
              }
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      {spinner ? (
        <PageIndicator />
      ) : (
        <>
          <CommentCommentItem>
            <GoAFormItem error={errors?.['name']} label="Name">
              <GoAInput
                type="text"
                name="comment-topicType-name"
                value={topicType.name}
                testId="comment-topicType-name"
                aria-label="comment-topicType-name"
                width="100%"
                onChange={(name, value) => {
                  const validations = {
                    name: value,
                    duplicate: value,
                  };
                  validators.remove('name');

                  validators.checkAll(validations);

                  setTopicType(
                    isEdit ? { ...topicType, name: value } : { ...topicType, name: value, id: toKebabName(value) }
                  );
                }}
              />
            </GoAFormItem>
          </CommentCommentItem>
          <GoAFormItem label="Topic type ID">
            <CommentCommentItem>
              <GoAInput
                name="comment-topicType-id"
                value={topicType.id}
                testId="comment-topicType-id"
                disabled={true}
                width="100%"
                // eslint-disable-next-line
                onChange={() => {}}
              />
            </CommentCommentItem>
          </GoAFormItem>
        </>
      )}
    </GoAModal>
  );
};
