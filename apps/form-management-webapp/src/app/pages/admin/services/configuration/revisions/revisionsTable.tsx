import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { Revision } from '@store/configuration/model';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { PageIndicator } from '@components/Indicator';
import { GoAButton, GoABadge, GoAButtonGroup, GoAModal } from '@abgov/react-components';
import { renderNoItem } from '@components/NoItem';
import { FormatTimeWithAt } from '@lib/timeUtil';
import { RevisionEditModal } from './revisionEditModal';
import {
  getConfigurationRevisions,
  getConfigurationActive,
  setConfigurationRevision,
  setConfigurationRevisionActive,
} from '@store/configuration/action';
import { RowFlex } from '../styled-components';
import { LoadMoreWrapper } from '@components/styled-components';
interface VisibleProps {
  visible: boolean;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hide'}`};
`;

interface RevisionComponentProps {
  revision: Revision;
  isLatest?: boolean;
  isActive?: boolean;
  isCore?: boolean;
  createRevision?: (revision: Revision) => void;
  setActiveRevision?: (revision: Revision) => void;
  editRevision?: (revision: Revision) => void;
}

const RevisionComponent: FunctionComponent<RevisionComponentProps> = ({
  revision,
  isLatest,
  isActive,
  isCore,
  createRevision,
  setActiveRevision,
  editRevision,
}: RevisionComponentProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td>
          <div className="number-badge">
            {revision.revision}
            <div>
              {isLatest && <GoABadge type="information" content="latest" />}
              {isActive && <GoABadge type="success" content="active" />}
            </div>
          </div>
        </td>
        <td>{revision.lastUpdated ? FormatTimeWithAt(new Date(revision.lastUpdated)) : ''}</td>
        <td>
          <RowFlex>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
            {!isLatest && !isActive && (
              <GoAContextMenuIcon
                title="Set Active"
                type="power"
                onClick={() => setActiveRevision(revision)}
                testId={`revision-set-active-${revision.configuration.namespace}-${revision.configuration.namespace}`}
              />
            )}
            {isLatest && <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>}
            {isLatest && (
              <GoAContextMenuIcon
                title="Add revision"
                type="add"
                onClick={() => createRevision(revision)}
                testId={`revision-add-${revision.configuration.namespace}-${revision.configuration.namespace}`}
              />
            )}
          </RowFlex>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td headers="Revision details" colSpan={3} className="revision-details">
            <div>{JSON.stringify(revision.configuration, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};
interface NoItemRevisionComponentProps {
  service: string;
  onClick?: () => void;
}
const NoItemRevisionComponent: FunctionComponent<NoItemRevisionComponentProps> = ({ service, onClick }) => {
  return (
    <tr>
      <td></td>
      <td></td>
      <td>
        <GoAContextMenu>
          {<GoAContextMenuIcon type="create" title="Edit" testId={`revision-edit-${service}`} onClick={onClick} />}
        </GoAContextMenu>
      </td>
    </tr>
  );
};

interface RevisionTableComponentProps {
  className?: string;
  service: string;
}

const RevisionTableComponent: FunctionComponent<RevisionTableComponentProps> = ({ className, service }) => {
  const configurationRevisions = useSelector((state: RootState) => state.configuration.configurationRevisions);
  const revisions = configurationRevisions[service]?.revisions?.result;
  const [showCreateNewRevision, setShowCreateNewRevision] = useState(false);
  const [showActiveRevision, setShowActiveRevision] = useState(false);
  const [showEditRevision, setShowEditRevision] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const onSetActive = (revision) => {
    setSelectedRevision(revision);
    setShowActiveRevision(true);
  };
  const onEditRevision = (revision) => {
    setSelectedRevision(revision);
    setShowEditRevision(true);
  };

  const resetEdit = () => {
    setShowEditRevision(false);
  };
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const next = configurationRevisions[service]?.revisions?.next;

  const dispatch = useDispatch();
  const onNext = () => {
    dispatch(getConfigurationRevisions(service, next));
  };

  // eslint-disable-next-line
  useEffect(() => {
    if (revisions?.length > 0) {
      dispatch(getConfigurationActive(service));
    }
  }, [indicator, revisions]); // eslint-disable-line react-hooks/exhaustive-deps
  if (
    !configurationRevisions[service]?.revisions.next &&
    !configurationRevisions[service]?.revisions?.latest &&
    configurationRevisions[service]?.revisions?.result?.length
  ) {
    configurationRevisions[service].revisions.latest = configurationRevisions[service]?.revisions.result.length - 1;
  }
  const latest = configurationRevisions[service]?.revisions?.latest;
  const active = configurationRevisions[service]?.revisions?.active;
  const isCore = configurationRevisions[service]?.revisions?.isCore;
  return (
    <>
      <Visible visible={!indicator.show && revisions && revisions.length > 0}>
        <div className={className}>
          <DataTable>
            <colgroup>
              <col className="number-col" />
              <col className="data-col" />
              <col className="action-col" />
            </colgroup>
            <thead>
              <tr>
                <th id="revision number">Revision number</th>
                <th id="revision date">Revision date</th>
                <th id="action">Action</th>
              </tr>
            </thead>
            <tbody>
              {revisions !== null &&
                revisions &&
                revisions.map((revision) => (
                  <RevisionComponent
                    key={`${revision.created}-${service}-${revision.revision}`}
                    revision={revision}
                    isLatest={revision.revision === latest}
                    isActive={revision.revision === active}
                    isCore={isCore}
                    createRevision={() => setShowCreateNewRevision(true)}
                    setActiveRevision={onSetActive}
                    editRevision={onEditRevision}
                  />
                ))}
            </tbody>
          </DataTable>
          {!isCore && !indicator.show && revisions && revisions.length === 0 && (
            <p> You must save valid configuration data in order to create a new revision</p>
          )}
        </div>
      </Visible>
      {indicator.show && <PageIndicator />}
      {!indicator.show && revisions && revisions.length === 0 && isCore && renderNoItem(`revisions`)}
      {next && (
        <LoadMoreWrapper>
          <GoAButton onClick={onNext} type="tertiary">
            Load more
          </GoAButton>
        </LoadMoreWrapper>
      )}
      <GoAModal
        open={showCreateNewRevision}
        heading={`Create a revision for ${service} ?`}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="revision-create-cancel-button"
              onClick={() => setShowCreateNewRevision(false)}
            >
              Cancel
            </GoAButton>
            <GoAButton
              testId="revision-create-button"
              onClick={() => {
                setShowCreateNewRevision(false);
                dispatch(setConfigurationRevision(service));
              }}
            >
              Create
            </GoAButton>
          </GoAButtonGroup>
        }
      />
      <GoAModal
        open={showActiveRevision}
        heading={`Set active revision for ${service} revision ${selectedRevision?.revision}?`}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="revision-active-cancel-button"
              onClick={() => setShowActiveRevision(false)}
            >
              Cancel
            </GoAButton>
            <GoAButton
              testId="revision-active-button"
              onClick={() => {
                setShowActiveRevision(false);
                dispatch(setConfigurationRevisionActive(service, selectedRevision.revision));
              }}
            >
              Set Active
            </GoAButton>
          </GoAButtonGroup>
        }
      />
      {showEditRevision && (
        <RevisionEditModal open={showEditRevision} revision={selectedRevision} service={service} onClose={resetEdit} />
      )}
    </>
  );
};

export const RevisionTable = styled(RevisionTableComponent)`
  padding-top: 1rem;
  & table {
    table-layout: fixed;
  }
  $ .number-col {
    width: 30%;
  }
  & .data-col {
    width: 43%;
  }
  & .action-col {
    width: 27%;
  }
  & .number-badge {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-right: 2rem;
  }

  & .revision-details {
    div {
      background: #f3f3f3;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      line-height: 16px;
      padding: 16px;
      overflow-wrap: break-word;
    }
    padding: 0;
  }
  & span {
    margin-right: 8px;
  }
`;
