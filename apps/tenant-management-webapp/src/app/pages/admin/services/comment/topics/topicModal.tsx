import React, { FunctionComponent, useState } from 'react';

import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoASkeleton,
  GoATextArea,
} from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { TopicItem, defaultTopic } from '@store/comment/model';
import {
  badCharsCheck,
  wordMaxLengthCheck,
  isNotEmptyCheck,
  duplicateNameCheck,
  Validator,
} from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { RootState } from '@store/index';

import { DescriptionItem } from '../styled-components';
import { HelpTextComponent } from '@components/HelpTextComponent';
interface TopicModalProps {
  type: string;

  topicType: string;
  onCancel?: () => void;
  onSave: (topic: TopicItem) => void;
  open: boolean;
}

export const TopicModal: FunctionComponent<TopicModalProps> = ({
  type,
  onCancel,
  onSave,
  open,
  topicType,
}: TopicModalProps): JSX.Element => {
  const [topic, setTopic] = useState<TopicItem>(defaultTopic);
  const [selectedTopicType, setSelectedTopic] = useState(topicType);
  const topicTypes = useSelector((state: RootState) => {
    return state?.comment?.topicTypes;
  });

  const coreTopicTypes = useSelector((state: RootState) => {
    return state?.comment?.core;
  });

  const descErrMessage = 'Description can not be over 180 characters';

  const title = 'Add topic';
  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const topics = useSelector((state: RootState) => state.comment.topics);
  const topicNames = topics && Array.isArray(topics) ? topics.map((t) => t.name) : [];

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    namespaceCheck(),
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add(
      'duplicated',
      'name',
      isNotEmptyCheck('name'),
      wordMaxLengthCheck(32, 'Name'),
      duplicateNameCheck(topicNames, 'Topic')
    )
    .add('typeId', 'typeId', isNotEmptyCheck('typeId'))
    .add('resourceId', 'resourceId', isNotEmptyCheck('typeId'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const validationCheck = () => {
    const validations = {
      name: topic?.name,
      typeId: topic?.typeId,
    };

    validations['name'] = topic?.name;
    validations['duplicated'] = topic?.name;
    validations['typeId'] = topic?.typeId && topic?.typeId !== '' ? topic?.typeId : selectedTopicType;
    validations['resourceId'] = topic?.resourceId;

    if (!validators.checkAll(validations)) {
      return;
    }
    topic.typeId = topic?.typeId && topic?.typeId !== '' ? topic?.typeId : selectedTopicType;
    onSave(topic);
    onCancel();
    validators.clear();
  };

  return (
    <GoAModal
      heading={title}
      testId="add-topic-modal"
      open={open}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="topic-modal-cancel"
            onClick={() => {
              validators.clear();
              setTopic(topic);
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="topic-modal-save"
            disabled={!topic?.name || !topic?.resourceId || validators.haveErrors()}
            onClick={() => {
              validationCheck();
              setTopic(topic);
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <div>
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="name"
            value={topic?.name}
            testId={`topic-modal-name-input`}
            width="100%"
            aria-label="name"
            onChange={(name, value) => {
              validators.remove('name');
              validators['name'].check(value);

              setTopic({ ...topic, name: value });
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="Select a topic type">
          {indicator.show && Object.keys(topicTypes).length === 0 && <GoASkeleton type="text" key={1}></GoASkeleton>}
          {Object.keys(topicTypes).length > 0 && (
            <GoADropdown
              name="TopicTypes"
              value={selectedTopicType}
              onChange={(name, selectedTopicType: string) => {
                setSelectedTopic(selectedTopicType);
                validators.remove('typeId');
                validators['typeId'].check(selectedTopicType);
                setTopic({ ...topic, typeId: selectedTopicType });
              }}
              aria-label="add-select-topicType-dropdown"
              width={'54ch'}
              testId="add-comment-select-topicType-dropdown"
            >
              {Object.keys(topicTypes).map((item) => (
                <GoADropdownItem
                  name="TopicTypes"
                  key={item}
                  label={item}
                  value={item}
                  testId={`${item}-get-comment-options`}
                />
              ))}
              {Object.keys(coreTopicTypes).map((item) => (
                <GoADropdownItem
                  name="CoreTopicTypes"
                  key={item}
                  label={item}
                  value={item}
                  testId={`${item}-get-comment-options`}
                />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>

        <GoAFormItem label="Description">
          <DescriptionItem>
            <GoATextArea
              name="description"
              value={topic?.description}
              width="100%"
              testId="description"
              aria-label="description"
              onKeyPress={(name, value, key) => {
                validators.remove('description');
                validators['description'].check(value);
                setTopic({ ...topic, description: value });
              }}
              // eslint-disable-next-line
              onChange={(name, value) => {}}
            />
            <HelpTextComponent
              length={topic?.description?.length || 0}
              maxLength={180}
              descErrMessage={descErrMessage}
              errorMsg={errors?.['content']}
            />
          </DescriptionItem>
        </GoAFormItem>
        <GoAFormItem label="Resource ID">
          <GoAInput
            type="text"
            name="resourceid"
            value={topic?.resourceId}
            testId={`topic-modal-resourceid-input`}
            width="100%"
            aria-label="resourceid"
            onChange={(name, value) => {
              validators.remove('resourceid');

              setTopic({ ...topic, resourceId: value });
            }}
          />
        </GoAFormItem>
      </div>
    </GoAModal>
  );
};
