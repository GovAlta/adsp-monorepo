import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { Revision } from '@store/configuration/model';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { PageIndicator } from '@components/Indicator';
import { GoAButton, GoABadge, GoAButtonGroup, GoAModal } from '@abgov/react-components-new';
import { renderNoItem } from '@components/NoItem';
import { FormatTimeWithAt } from '@lib/timeUtil';
import {
  getConfigurationRevisions,
  getConfigurationActive,
  setConfigurationRevision,
} from '@store/configuration/action';

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
  createRevision?: (revision: Revision) => void;
}

const RevisionComponent: FunctionComponent<RevisionComponentProps> = ({
  revision,
  isLatest,
  isActive,
  createRevision,
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
          <GoAContextMenu>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
            {isLatest && (
              <GoAContextMenuIcon
                title="Add revision"
                type="add"
                onClick={() => createRevision(revision)}
                testId="toggle-details-visibility"
              />
            )}
          </GoAContextMenu>
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

interface RevisionTableComponentProps {
  className?: string;
  service: string;
}

const RevisionTableComponent: FunctionComponent<RevisionTableComponentProps> = ({ className, service }) => {
  const configurationRevisions = useSelector((state: RootState) => state.configuration.configurationRevisions);
  const revisions = configurationRevisions[service]?.revisions?.result;
  const [showCreateNewRevision, setShowCreateNewRevision] = useState(false);
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
  }, [indicator, revisions]);
  const latest = configurationRevisions[service]?.revisions?.latest;
  const active = configurationRevisions[service]?.revisions?.active;

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
                    createRevision={() => setShowCreateNewRevision(true)}
                  />
                ))}
            </tbody>
          </DataTable>
        </div>
      </Visible>
      {indicator.show && <PageIndicator />}
      {!indicator.show && revisions && revisions.length === 0 && renderNoItem(`revisions`)}
      {next && (
        <GoAButton onClick={onNext} type="secondary">
          Load more...
        </GoAButton>
      )}
      <GoAModal
        open={showCreateNewRevision}
        heading={`Create a revision for ${service} ?`}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton type="secondary" onClick={() => setShowCreateNewRevision(false)}>
              Cancel
            </GoAButton>
            <GoAButton
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
    width: 55%;
  }
  & .action-col {
    width: 15%;
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
