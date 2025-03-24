import React, { FunctionComponent } from 'react';
import { ActionIconsDiv } from '../../styled-components';
import { MoreDetails } from '../styled-components';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { TopicItem } from '@store/comment/model';
import { CommentListTable } from '../comments/commentsTable';

interface TopicTableItemProps {
  id: string;
  topic: TopicItem;
  selectedType: string;
  showDetails: boolean;
  onDeleteTopic?: (Topic) => void;
  onToggleDetails: () => void;
}

export const TopicTableItem: FunctionComponent<TopicTableItemProps> = ({
  id,
  topic,
  selectedType,
  showDetails,
  onDeleteTopic,
  onToggleDetails,
}: TopicTableItemProps) => {
  return (
    <>
      <tr>
        <td>{topic.name}</td>
        <td>{topic.resourceId}</td>
        <td>
          <ActionIconsDiv>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={onToggleDetails}
              testId="toggle-details-visibility"
            />
            <GoAContextMenuIcon
              testId="topic-definition-delete"
              title="Delete"
              type="trash"
              onClick={() => onDeleteTopic(topic)}
            />
          </ActionIconsDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: '0px',
            }}
          >
            <MoreDetails>
              <p>Topic description</p>
              <span>{topic.description}</span>
              <CommentListTable topic={topic} selectedType={selectedType}></CommentListTable>
            </MoreDetails>
          </td>
        </tr>
      )}
    </>
  );
};
