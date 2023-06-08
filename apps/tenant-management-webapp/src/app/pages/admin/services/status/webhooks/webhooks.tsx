import React, { useState } from 'react';

import { Webhooks } from '@store/status/models';
import DataTable from '@components/DataTable';
import styled from 'styled-components';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { WebhookFormModal } from '../webhookForm';
import { WebhookHistoryModal } from '../webhookHistoryForm';

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
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    intervalSeconds: number;
    description: string;
    eventTypes: { id: string }[];
    onEdit?: () => void;
    onDelete?: () => void;
    onHistory?: () => void;
  }

  const FileTypeTableRow = ({
    id,
    name,
    url,
    targetId,
    intervalSeconds,
    eventTypes,
    description,
    onEdit,
    onDelete,
    onHistory,
  }: FileTypeRowProps): JSX.Element => {
    const [showDetails, setShowDetails] = useState<boolean>(false);

    const details = {
      id,
      name,
      url,
      targetId,
      intervalSeconds,
      eventTypes,
      description,
    };

    return (
      <>
        <tr key={id}>
          <td>{name}</td>
          <td className="url"> {url}</td>

          <td className="waitInterval">{intervalSeconds / 60} min</td>
          <td className="actionCol">
            <GoAContextMenu>
              <GoAIconButton
                testId={`webhook-details-${id}`}
                title="Details"
                size="medium"
                type="information-circle"
                onClick={() => {
                  setShowDetails(!showDetails);
                }}
              />
              <GoAIconButton
                testId={`webhook-history-${id}`}
                title="History"
                size="medium"
                type="time"
                onClick={() => {
                  onHistory();
                }}
              />
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                testId={`webhook-edit-${id}`}
                onClick={() => {
                  onEdit();
                }}
              />
              <GoAIconButton
                testId={`webhook-delete-${id}`}
                title="Delete"
                size="medium"
                type="trash"
                onClick={() => {
                  onDelete();
                }}
              />
            </GoAContextMenu>
          </td>
        </tr>
        {showDetails && (
          <tr>
            <NoPaddingTd headers="correlation timestamp namespace name details" colSpan={5} className="event-details">
              <EntryDetail>{JSON.stringify(details, null, 2)}</EntryDetail>
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
              <th id="intervalSeconds" data-testid="events-definitions-table-header-name">
                Wait Interval
              </th>
              <th className="actionsCol" id="actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(webhooks).map((key) => {
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
