import React, { useState, useEffect } from 'react';
import DataTable from '@components/DataTable';
import styled from 'styled-components';
import { WebhookHistoryModal } from '../webhookHistoryForm';
import { TestWebhookModal } from '../testWebhook';
import History from '../../../../../../assets/icons/history.svg';
import { HoverWrapper, ToolTip } from '../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { WebhookDeleteModal } from './webhookDeleteModal';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateModalState } from '@store/session/actions';
import {
  AddEditStatusWebhookType,
  StatusWebhookHistoryType,
  DeleteStatusWebhookType,
  TestStatusWebhookType,
  Webhooks as WebhookEntity,
} from '@store/status/models';
import { selectStatusWebhooks } from '@store/status/selectors';
import { fetchWebhooks } from '@store/status/actions';
export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 12px;
  padding: 16px;
  text-align: left;
`;

export const NoPaddingTd = styled.td`
  padding: 0px !important;
`;

interface WebhookRowProps {
  webhook: WebhookEntity;
}

const WebhookTableRow = ({ webhook }: WebhookRowProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const { id, url, intervalMinutes, name, description } = webhook;
  const dispatch = useDispatch();
  const [isShowURL, setIsShowURL] = useState<string>('');
  const urlLength = 14;

  return (
    <>
      <Menu key={id}>
        <td>{name}</td>
        <td className="url">
          <HoverWrapper
            onMouseEnter={() => {
              setIsShowURL(id);
            }}
            onMouseLeave={() => {
              setIsShowURL('');
            }}
          >
            <div>{url?.length >= urlLength ? `${url?.substring(0, urlLength)}...` : url}</div>

            {isShowURL === id && (
              <ToolTip>
                <p className="url-tooltip">
                  <div className="message">{url}</div>
                </p>
              </ToolTip>
            )}
          </HoverWrapper>
        </td>

        <td className="waitInterval">{intervalMinutes} min</td>
        <td className="actionCol">
          <GoAContextMenu>
            <GoAContextMenuIcon
              testId={`webhook-details-${id}`}
              title="Details"
              type="information-circle"
              onClick={() => {
                setShowDetails(!showDetails);
              }}
            />
            <div
              onClick={() => {
                dispatch(
                  UpdateModalState({
                    type: StatusWebhookHistoryType,
                    isOpen: true,
                    id,
                  })
                );
              }}
              className="hover-blue tooltip"
            >
              <img src={History} alt="History" />
              <span className="tooltip-text">Webhook history</span>
            </div>
            <GoAContextMenuIcon
              testId={`webhook-test-${id}`}
              title="Test"
              type="ticket"
              onClick={() => {
                dispatch(
                  UpdateModalState({
                    type: TestStatusWebhookType,
                    isOpen: true,
                    id,
                  })
                );
              }}
            />
            <GoAContextMenuIcon
              testId={`webhook-edit-${id}`}
              title="Edit"
              type="create"
              onClick={() => {
                dispatch(
                  UpdateModalState({
                    type: AddEditStatusWebhookType,
                    isOpen: true,
                    id,
                  })
                );
              }}
            />
            <GoAContextMenuIcon
              testId={`webhook-delete-${id}`}
              title="Delete"
              type="trash"
              onClick={() => {
                dispatch(
                  UpdateModalState({
                    type: DeleteStatusWebhookType,
                    isOpen: true,
                    id,
                  })
                );
              }}
            />
          </GoAContextMenu>
        </td>
      </Menu>
      {showDetails && (
        <tr>
          <NoPaddingTd headers="correlation timestamp namespace name details" colSpan={5} className="event-details">
            <EntryDetail>{description}</EntryDetail>
          </NoPaddingTd>
        </tr>
      )}
    </>
  );
};

export const WebhookListTable = () => {
  const dispatch = useDispatch();

  const webhooks = useSelector(selectStatusWebhooks);
  useEffect(() => {
    dispatch(fetchWebhooks());
  }, [dispatch]);

  // eslint-disable-next-line
  useEffect(() => {}, [webhooks]);

  if (webhooks && Object.keys(webhooks).length === 0) {
    return <b>There are no webhooks yet</b>;
  }

  return (
    <>
      <TableLayout>
        <DataTable data-testid="file-types-table">
          <thead data-testid="file-types-table-header">
            <tr>
              <th id="name" data-testid="events-definitions-table-header-name">
                Name
              </th>
              <th id="URL" data-testid="events-definitions-table-header-name">
                URL
              </th>
              <th id="intervalMinutes" data-testid="events-definitions-table-header-name">
                Wait Interval
              </th>
              <th className="actionsCol" id="actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {webhooks &&
              Object.values(webhooks).map((webhook) => {
                if (webhook === null) return null;
                return <WebhookTableRow key={`webhook-${webhook.id}`} webhook={webhook} />;
              })}
          </tbody>
        </DataTable>
      </TableLayout>
      <WebhookActionModals />
    </>
  );
};

export const WebhookActionModals = (): JSX.Element => {
  return (
    <div data-testid="application">
      <TestWebhookModal />
      <WebhookDeleteModal />
      <WebhookHistoryModal />
    </div>
  );
};

const TableLayout = styled.div`
  margin-top: 1em;
  table {
    margin-bottom: 15px;
  }
  table,
  th,
  td {
    .anonymousCol {
      width: 15%;
    }
    .actionsCol {
      width: 15%;
    }
    .readRolesCol {
      width: 35%;
    }
    .updateRolesCol {
      width: 35%;
    }
  }
`;

const Menu = styled.tr`
  vertical-align: top;
  .hover-blue:hover {
    background: #f1f1f1;
    cursor: pointer;
  }

  .hover-blue {
    padding: 5px 5px 0 5px;
    border-radius: 7px;
  }

  .hover {
    display: none;
  }

  .hover {
    display: block;
  }

  .tooltip {
    position: relative;
    display: inline-block;
  }

  .tooltip .tooltip-text {
    visibility: hidden;
    width: 90px;
    background-color: white;
    color: #0f0f0f;
    font-size: 11px;
    text-align: center;
    border: 1px solid black;

    /* Position the tooltip */
    position: absolute;
    z-index: 1;
    top: 25px;
    left: 70%;
  }

  .tooltip:hover .tooltip-text {
    visibility: visible;
    transition: all 0.4s 0.7s ease;
  }
`;
