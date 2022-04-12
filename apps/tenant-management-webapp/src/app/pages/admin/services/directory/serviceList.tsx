import React, { FunctionComponent, useMemo, useState, useEffect } from 'react';
import { GoAElementLoader } from '@abgov/react-components';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { Service } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEntryDetail } from '@store/directory/actions';
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
  const elementIndicator = useSelector((state: RootState) => {
    return state?.session?.elementIndicator;
  });

  const renderNoItem = () => {
    return (
      <NoItem>
        <p>No metadata placeholder</p>
      </NoItem>
    );
  };
  // eslint-disable-next-line
  useEffect(() => {}, [elementIndicator]);

  return (
    <>
      <tr key={service.urn}>
        <td headers="service" data-testid="service">
          {service.service}
        </td>
        <td headers="api" data-testid="api">
          {service.api}
        </td>
        <td headers="directory" data-testid="directory">
          {service.url}
        </td>
        <td>
          <IconDiv>
            <GoAContextMenu>
              {!service.api && (
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
                  testId={`directory-edit-${service.service}`}
                  onClick={() => {
                    onEdit(service);
                  }}
                />
              )}
              {!service.isCore && (
                <GoAIconButton
                  testId={`directory-delete-${service.service}`}
                  title="Delete"
                  size="medium"
                  type="trash"
                  onClick={() => {
                    onDelete(service);
                  }}
                />
              )}
            </GoAContextMenu>
          </IconDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td headers="Entry metadata information" colSpan={5} className="meta">
            <EntryDetail data-testid="details">
              {!service.loaded && (
                <GoAElementLoader
                  visible={elementIndicator.show}
                  size="default"
                  baseColour="#c8eef9"
                  spinnerColour="#0070c4"
                />
              )}
              {service.metadata === null ? renderNoItem() : JSON.stringify(service.metadata, null, 2)}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

interface serviceTableProps {
  namespace: string;
  directory: Service[];
  isCore: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export const ServiceTableComponent: FunctionComponent<serviceTableProps> = ({
  namespace,
  directory,
  isCore,
  onEdit,
  onDelete,
}) => {
  const memoizedDirectory = useMemo(() => {
    return [...directory].sort((a, b) => (a.service < b.service ? -1 : 1));
  }, [directory]);

  return (
    <TableDiv key={namespace}>
      <DataTable data-testid="directory-table">
        <thead data-testid="directory-table-header">
          <tr>
            <th id="directory-service" data-testid="directory-table-header-name">
              Service
            </th>
            <th id="directory-api" data-testid="directory-table-header-name">
              API
            </th>
            <th id="directory-url">URL</th>
            <th id="directory-action">Action</th>
          </tr>
        </thead>

        <tbody key={`${namespace}:${isCore}`}>
          {isCore
            ? memoizedDirectory
                .filter((dir) => dir.namespace === namespace)
                .map((dir: Service) => <ServiceItemComponent service={dir} onEdit={onEdit} onDelete={onDelete} />)
            : directory
                .filter((dir) => dir.namespace === namespace)
                .sort((a, b) => (a.service < b.service ? -1 : 1))
                .map((dir: Service) => <ServiceItemComponent service={dir} onEdit={onEdit} onDelete={onDelete} />)}
        </tbody>
      </DataTable>
      <br />
    </TableDiv>
  );
};
const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  text-align: left;
`;

const TableDiv = styled.div`
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
    text-align: right;
  }
  & .meta {
    padding: 0;
  }
`;

const IconDiv = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

const NoItem = styled.div`
  text-align: center;
  padding-top: 1.5rem;
  padding-bottom: 0.5rem;
`;
