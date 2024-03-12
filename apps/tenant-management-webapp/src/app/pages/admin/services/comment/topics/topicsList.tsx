import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { getCommentTopicTypes, fetchTopicsRequest, addTopicRequest, clearComments } from '@store/comment/action';

import { renderNoItem } from '@components/NoItem';
import {
  GoAButton,
  GoACircularProgress,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoASkeleton,
} from '@abgov/react-components-new';
import { TopicModal } from './topicModal';
import { ButtonPadding, ProgressWrapper, Topics } from '../styled-components';
import { TopicListTable } from './topicsTable';
import { DeleteConfirmationsView } from './deleteConfirmationsView';
import { LoadMoreWrapper } from '@components/styled-components';
import { TopicItem, defaultTopic } from '@store/comment/model';

interface VisibleProps {
  visible: boolean;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hidden'}`};
`;

export const TopicsList = (): JSX.Element => {
  const dispatch = useDispatch();
  const [openAddTopic, setOpenAddTopic] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showActions, setShowActions] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem>(defaultTopic);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const topicTypes = useSelector((state: RootState) => {
    return state?.comment?.topicTypes;
  });
  const coreTopicTypes = useSelector((state: RootState) => {
    return state?.comment?.core;
  });
  const next = useSelector((state: RootState) => state.comment.nextEntries);
  const topics = useSelector((state: RootState) => state.comment.topics);
  const [topicList, setTopicList] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    dispatch(getCommentTopicTypes());
  }, [dispatch]);
  useEffect(() => {
    if (selectedType && selectedType !== '') {
      if (coreTopicTypes[selectedType]) {
        setShowActions(false);
        dispatch(fetchTopicsRequest(coreTopicTypes[selectedType]));
      } else {
        setShowActions(true);
        dispatch(fetchTopicsRequest(topicTypes[selectedType]));
      }
    }
  }, [dispatch, topicTypes, selectedType, topicList, coreTopicTypes]);

  const onNext = () => {
    dispatch(fetchTopicsRequest(topicTypes[selectedType], next));
  };

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [openAddTopic, showDeleteConfirmation]);

  const reset = () => {
    setOpenAddTopic(false);
  };

  const onDeleteTopic = () => {
    indicator.show = true;
    setShowDeleteConfirmation(false);
    setTimeout(() => {
      dispatch(fetchTopicsRequest(topicTypes[selectedType]));
      indicator.show = false;
    }, 800);
  };

  const handleSave = (topic) => {
    setTopicList(topic);
    dispatch(addTopicRequest(topic));
    dispatch(fetchTopicsRequest(topicTypes[selectedType]));
    setOpenAddTopic(false);
  };

  return (
    <Topics>
      {!indicator.show &&
        Object.keys(topicTypes).length === 0 &&
        Object.keys(coreTopicTypes).length === 0 &&
        renderNoItem('Topic types')}
      {(Object.keys(topicTypes).length > 0 || Object.keys(coreTopicTypes).length > 0) && (
        <GoAFormItem label="Select a topic type">
          {indicator.show && Object.keys(topicTypes).length === 0 && <GoASkeleton type="text" key={1}></GoASkeleton>}
          <GoADropdown
            name="TopicTypes"
            value={selectedType}
            onChange={(name: string, selectedType: string) => {
              dispatch(clearComments());
              setSelectedType(selectedType);
            }}
            aria-label="select-comment-topic-type-dropdown"
            width="100%"
            testId="comment-select-topic-type-dropdown"
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
        </GoAFormItem>
      )}
      {selectedType && (
        <div>
          <ButtonPadding>
            <GoAButton
              testId="add-topic-btn"
              onClick={() => {
                setModalType('new');
                setOpenAddTopic(true);
              }}
            >
              Add topic
            </GoAButton>
          </ButtonPadding>
        </div>
      )}
      {!next && indicator.show && (
        <ProgressWrapper>
          <GoACircularProgress visible={indicator.show} size="small" />
        </ProgressWrapper>
      )}
      {!indicator.show && selectedType !== '' && topics && Object.keys(topics).length === 0 && renderNoItem('topics')}
      {selectedType !== '' && topics && Object.keys(topics).length !== 0 && (
        <Visible visible={!indicator.show && selectedType !== '' && topics && Object.keys(topics).length !== 0}>
          {
            <TopicListTable
              topics={topics}
              selectedType={selectedType}
              showActions={showActions}
              onDeleteTopic={(topicSelected) => {
                setSelectedTopic(topicSelected);
                setShowDeleteConfirmation(true);
              }}
            />
          }

          {showDeleteConfirmation && selectedTopic && (
            <DeleteConfirmationsView
              topic={selectedTopic}
              selectedType={selectedType}
              onCancel={() => setShowDeleteConfirmation(false)}
              onDelete={onDeleteTopic}
            ></DeleteConfirmationsView>
          )}
          {next && (
            <LoadMoreWrapper>
              <GoAButton testId="comment-load-more-btn" key="comment-load-more-btn" type="tertiary" onClick={onNext}>
                Load more
              </GoAButton>
            </LoadMoreWrapper>
          )}
        </Visible>
      )}
      {openAddTopic && (
        <TopicModal
          open={openAddTopic}
          topicType={selectedType}
          type={modalType}
          onCancel={() => {
            reset();
          }}
          onSave={handleSave}
        />
      )}
    </Topics>
  );
};
