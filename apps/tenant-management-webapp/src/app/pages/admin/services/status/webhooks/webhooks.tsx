import React, { useState } from 'react';

import { Webhooks } from '@store/status/models';
import DataTable from '@components/DataTable';
import styled from 'styled-components';
import { WebhookFormModal } from '../webhookForm';
import { WebhookHistoryModal } from '../webhookHistoryForm';
import { TestWebhookModal } from '../testWebhook';
import History from '../../../../../../assets/icons/history.svg';
import { HoverWrapper, ToolTip } from '../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { WebhookDeleteModal } from './webhookDeleteModal';

interface WebhookDisplayProps {
  webhooks: Record<string, Webhooks>;
}

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

export const WebhooksDisplay = ({ webhooks }: WebhookDisplayProps): JSX.Element => {
  const [editId, setEditId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isShowURL, setIsShowURL] = useState<string>('');

  const onDeleteCancel = () => {
    setDeleteId(null);
  };
  const onHistoryCancel = () => {
    setHistoryId(null);
  };

  interface FileTypeRowProps {
    id: string;
    name: string;
    url: string;
    targetId: string;
    intervalMinutes?: number;
    description: string;
    eventTypes: { id: string }[];
    onEdit?: () => void;
    onDelete?: () => void;
    onTest?: () => void;
    onHistory?: () => void;
  }

  const FileTypeTableRow = ({
    id,
    name,
    url,
    targetId,
    intervalMinutes,
    eventTypes,
    description,
    onEdit,
    onDelete,
    onHistory,
    onTest,
  }: FileTypeRowProps): JSX.Element => {
    const [showDetails, setShowDetails] = useState<boolean>(false);

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
                  onHistory();
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
                  onTest();
                }}
              />
              <GoAContextMenuIcon
                testId={`webhook-edit-${id}`}
                title="Edit"
                type="create"
                onClick={() => {
                  onEdit();
                }}
              />
              <GoAContextMenuIcon
                testId={`webhook-delete-${id}`}
                title="Delete"
                type="trash"
                onClick={() => {
                  onDelete();
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

  return (
    <div data-testid="application">
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
              Object.keys(webhooks).map((key) => {
                if (!webhooks[key]) return null;
                return (
                  <FileTypeTableRow
                    key={`webhook-${webhooks[key].id}`}
                    {...webhooks[key]}
                    onDelete={() => {
                      setDeleteId(webhooks[key].id);
                    }}
                    onEdit={() => {
                      setEditId(webhooks[key].id);
                    }}
                    onHistory={() => {
                      setHistoryId(webhooks[key].id);
                    }}
                    onTest={() => {
                      setTestId(webhooks[key].id);
                    }}
                  />
                );
              })}
          </tbody>
        </DataTable>
      </TableLayout>
      {editId && (
        <WebhookFormModal
          isEdit={true}
          isOpen={true}
          testId={'edit-webhook'}
          defaultWebhooks={webhooks[editId]}
          title="Edit webhook"
          onCancel={() => {
            setEditId(null);
          }}
          onSave={() => {
            setEditId(null);
          }}
        />
      )}
      {testId && (
        <TestWebhookModal
          isOpen={testId !== null}
          testId={'test-webhook'}
          defaultWebhooks={webhooks[testId]}
          title="Test webhook"
          onClose={() => {
            setTestId(null);
          }}
        />
      )}
      {deleteId && <WebhookDeleteModal webhook={webhooks[deleteId]} onCancel={() => onDeleteCancel()} />}
      {historyId && <WebhookHistoryModal webhook={webhooks[historyId]} onCancel={() => onHistoryCancel()} />}
    </div>
  );
};

const TableLayout = styled.div`
  margin-top: 1em;
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
