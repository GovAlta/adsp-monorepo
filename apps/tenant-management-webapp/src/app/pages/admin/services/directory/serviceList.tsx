import React, { useState, useEffect, memo } from 'react';
import { GoAElementLoader } from '@abgov/react-components';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { Service, DeleteModalType, EditModalType, AddModalType } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEntryDetail } from '@store/directory/actions';
import DataTable from '@components/DataTable';
import { UpdateModalState } from '@store/session/actions';

interface serviceItemProps {
  service: Service;
}

const ServiceItemComponent = ({ service }: serviceItemProps): JSX.Element => {
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
        <p>No metadata found</p>
      </NoItem>
    );
  };
  // eslint-disable-next-line
  useEffect(() => {}, [elementIndicator]);

  return (
    <>
      <tr key={service.urn}>
        <td headers="directory-service" data-testid="service">
          {service.service}
        </td>
        <td headers="directory-api" data-testid="api">
          {service.api}
        </td>
        <td headers="directory-url" data-testid="directory">
          {service.url}
        </td>
        <td headers="directory-actions">
          <IconDiv>
            <GoAContextMenu>
              {!service.isCore && service.metadata?._links?.api && !service.api && service.hasApi && (
                <GoAContextMenuIcon
                  type="add"
                  title="add"
                  onClick={() => {
                    dispatch(
                      UpdateModalState({
                        type: AddModalType,
                        id: service.urn,
                        isOpen: true,
                      })
                    );
                  }}
                  testId="directory-toggle-details-visibility"
                />
              )}
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
                    dispatch(
                      UpdateModalState({
                        type: EditModalType,
                        id: service.urn,
                        isOpen: true,
                      })
                    );
                  }}
                />
              )}
              {!service.isCore && (
                <GoAContextMenuIcon
                  testId={`directory-delete-${service.service}`}
                  title="Delete"
                  type="trash"
                  key={service.urn}
                  onClick={() => {
                    dispatch(
                      UpdateModalState({
                        id: service.urn,
                        type: DeleteModalType,
                        isOpen: true,
                      })
                    );
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
                <ElementLoader>
                  <GoAElementLoader
                    visible={elementIndicator.show}
                    size="default"
                    baseColour="#c8eef9"
                    spinnerColour="#0070c4"
                  />
                </ElementLoader>
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
  directory: Service[];
}

export const ServiceTableComponent = ({ directory }: serviceTableProps): JSX.Element => {
  return (
    <TableDiv>
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
            <th id="directory-actions">Action</th>
          </tr>
        </thead>

        <tbody>
          {directory.map((dir: Service) => {
            return <ServiceItemComponent key={`directory-list-item-${dir.urn}`} service={dir} />;
          })}
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
  padding: 16px;
`;

const TableDiv = memo(styled.div`
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
`);

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

const ElementLoader = styled.div`
  text-align: center;
  padding-top: 1.3rem;
  padding-bottom: 1rem;
`;
