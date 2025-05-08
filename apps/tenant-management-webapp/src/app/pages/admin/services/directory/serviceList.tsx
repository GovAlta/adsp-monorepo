import React, { useState, useEffect, memo } from 'react';
import { GoACircularProgress } from '@abgov/react-components';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { Service, DeleteModalType, EditModalType, AddModalType } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEntryDetail } from '@store/directory/actions';
import DataTable from '@components/DataTable';
import { UpdateModalState } from '@store/session/actions';
import { EntryDetail } from '../styled-components';
import { renderNoItem } from '@components/NoItem';
interface serviceItemProps {
  service: Service;
  id: string;
  headerId: string;
}

const ServiceItemComponent = ({ service, id, headerId }: serviceItemProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState(false);

  const dispatch = useDispatch();

  const setDetails = (service: Service) => {
    if (!showDetails) {
      dispatch(fetchEntryDetail(service));
    }

    setShowDetails(!showDetails);
  };
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);
  const elementIndicator = useSelector((state: RootState) => {
    return state?.session?.elementIndicator;
  });

  // eslint-disable-next-line
  useEffect(() => {}, [elementIndicator]);

  return (
    <>
      <tr key={service.urn}>
        <td headers={`${headerId}-directory-service`} data-testid="service">
          {service.service}
        </td>
        <td headers={`${headerId}-directory-api`} data-testid="api">
          {service.api}
        </td>
        <td headers={`${headerId}-directory-url`} data-testid="directory">
          {service.url}
        </td>
        <td headers={`${headerId}-directory-actions`}>
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
                  testId={`directory-add-${service.service}`}
                />
              )}
              {!service.api && (
                <GoAContextMenuIcon
                  type={showDetails ? 'eye-off' : 'eye'}
                  title="Toggle details"
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
              {!service.loaded && elementIndicator.show && elementIndicator?.id === service.urn && (
                <ElementLoader>
                  <GoACircularProgress visible={true} size="small" />
                </ElementLoader>
              )}
              {service.metadata === null ? renderNoItem('metadata') : JSON.stringify(service.metadata, null, 2)}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

interface serviceTableProps {
  directory: Service[];
  headerId: string;
}

export const ServiceTableComponent = ({ directory, headerId }: serviceTableProps): JSX.Element => {
  return (
    <TableDiv>
      <DataTable id={`${headerId}-directory-table`} data-testid="directory-table">
        <thead data-testid="directory-table-header">
          <tr>
            <th id={`${headerId}-directory-service`} data-testid="directory-table-header-name">
              Service
            </th>
            <th id={`${headerId}-directory-api`} data-testid="directory-table-header-name">
              API
            </th>
            <th id={`${headerId}-directory-url`}>URL</th>
            <th id={`${headerId}-directory-actions`}>Action</th>
          </tr>
        </thead>

        <tbody>
          {directory.map((dir: Service) => {
            return (
              <ServiceItemComponent
                key={dir.urn}
                id={`directory-list-item-${dir.urn}`}
                service={dir}
                headerId={headerId}
              />
            );
          })}
        </tbody>
      </DataTable>
      <br />
    </TableDiv>
  );
};

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
  margin-top: 1.3rem;
  margin-bottom: 1rem;
`;
