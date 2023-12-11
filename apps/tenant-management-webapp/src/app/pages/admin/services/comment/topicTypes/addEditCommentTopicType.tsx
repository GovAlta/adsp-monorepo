import React, { FunctionComponent, useState, useEffect } from 'react';
import { CommentTopicTypes } from '@store/comment/model';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { SpinnerModalPadding, CommentCommentItem } from '../styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { useRouteMatch } from 'react-router';
import { useHistory } from 'react-router-dom';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

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
  const { url } = useRouteMatch();
  const history = useHistory();
  const [topicType, setTopicType] = useState<CommentTopicTypes>(initialValue);
  const [spinner, setSpinner] = useState<boolean>(false);

  const topicTypes = useSelector((state: RootState) => {
    return state?.comment?.topicTypes;
  });

  const topicTypeNames = Object.values(topicTypes).map((val) => {
    return val.name;
  });

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    if (spinner && Object.keys(topicTypes).length > 0 && !isEdit) {
      if (validators['duplicate'].check(topicType.id)) {
        setSpinner(false);

        onClose();
        history.push({ pathname: `${url}/edit/${topicType.id}` });
      }
    }
  }, [topicTypes]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    setTopicType(initialValue);
  }, [open]);

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
        <SpinnerModalPadding>
          <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
        </SpinnerModalPadding>
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
