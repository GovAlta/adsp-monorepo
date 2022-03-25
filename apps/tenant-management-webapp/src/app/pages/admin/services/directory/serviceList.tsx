import React, { FunctionComponent, useMemo, useState } from 'react';

import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { Service } from '@store/directory/models';
import { useDispatch } from 'react-redux';
import { fetchEntryDetail } from '@store/directory/actions';
import { renderNoItem } from '@components/NoItem';
import DataTable from '@components/DataTable';
interface serviceItemProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

const ServiceItemComponent: FunctionComponent<serviceItemProps> = ({ service, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const dispatch = useDispatch();

  const setDetails = (service: Service) => {
    if (!showDetails) {
      dispatch(fetchEntryDetail(service));
    }
    setShowDetails(!showDetails);
  };

  return (
    <>
      <tr key={service.urn}>
        <td headers="namespace" data-testid="namespace">
          {service.namespace}
        </td>
        <td headers="directory" data-testid="directory">
          {service.url}
        </td>
        <td className="actionCol">
          <GoAContextMenu>
            {service.service.split(':').length === 1 && (
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                onClick={() => setDetails(service)}
                testId="directory-toggle-details-visibility"
              />
            )}
            {!service.isCore && (
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                testId={`directory-edit-${service.namespace}`}
                onClick={() => {
                  onEdit(service);
                }}
              />
            )}
            {!service.isCore && (
              <GoAIconButton
                testId={`directory-delete-${service.namespace}`}
                title="Delete"
                size="medium"
                type="trash"
                onClick={() => {
                  onDelete(service);
                }}
              />
            )}
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td headers="Entry metadata information" colSpan={5}>
            {service.metadata === null ? (
              renderNoItem('service metadata')
            ) : (
              <EntryDetail data-testid="details">{JSON.stringify(service.metadata, null, 4)}</EntryDetail>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

interface serviceTableProps {
  namespace: string;
  directory: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export const ServiceTableComponent: FunctionComponent<serviceTableProps> = ({
  namespace,
  directory,
  onEdit,
  onDelete,
}) => {
  const memoizedDirectory = useMemo(() => {
    return [...directory].sort((a, b) => (a.namespace < b.namespace ? -1 : 1));
  }, [directory]);

  return (
    <TableDiv key={namespace}>
      <NameDiv>{namespace}</NameDiv>
      <DataTable data-testid="directory-table">
        <thead data-testid="directory-table-header">
          <tr>
            <th id="name" data-testid="directory-table-header-name">
              Name
            </th>
            <th id="directory">URL</th>
            <th id="directory">Action</th>
          </tr>
        </thead>

        <tbody key={namespace}>
          {memoizedDirectory
            .filter((dir) => dir.namespace === namespace)
            .map((dir: Service) => (
              <ServiceItemComponent service={dir} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </tbody>
      </DataTable>
      <br />
    </TableDiv>
  );
};
export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
`;
export const NameDiv = styled.div`
  margin-top: 1rem;
  text-transform: capitalize;
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;
export const TableDiv = styled.div`
  & td:first-child {
    width: 100px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }
`;
