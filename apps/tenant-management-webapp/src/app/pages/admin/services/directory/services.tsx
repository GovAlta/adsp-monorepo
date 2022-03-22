import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchDirectory } from '@store/directory/actions';
import DataTable from '@components/DataTable';
import { Service, defaultService } from '@store/directory/models';
import styled from 'styled-components';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton } from '@abgov/react-components';
import { DeleteModal } from '@components/DeleteModal';
import { DirectoryModal } from './directoryModal';
import { deleteEntry } from '@store/directory/actions';
import { ServiceItemComponent } from './serviceList';
export const DirectoryService: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [isEdit, setIsEdit] = useState(false);
  const [editEntry, setEditEntry] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Service>(defaultService);

  useEffect(() => {
    dispatch(fetchDirectory());
  }, []);
  const coreTenant = 'Platform';
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const { directory } = useSelector((state: RootState) => state.directory);

  const nameArray = [...new Map(directory.map((item) => [item['name'], item])).values()];

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  function reset() {
    setEditEntry(false);
    setSelectedEntry(defaultService);
  }

  const onEdit = (service) => {
    setSelectedEntry(service);
    setIsEdit(true);
    setEditEntry(true);
  };
  const onDelete = (service) => {
    setShowDeleteConfirmation(true);
    setSelectedEntry(service);
  };
  return (
    <>
      <PageIndicator />
      {!indicator.show && !nameArray && renderNoItem('directory')}
      {!indicator.show && nameArray && (
        <div>
          {tenantName !== coreTenant && (
            <GoAButton
              data-testid="add-directory-btn"
              onClick={() => {
                defaultService.name = tenantName;
                setSelectedEntry(defaultService);
                setIsEdit(false);
                setEditEntry(true);
              }}
            >
              Add entry
            </GoAButton>
          )}
          <br />
          {nameArray.map((item) => (
            <TableDiv key={item['name']}>
              <NameDiv>{item['name']}</NameDiv>
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

                <tbody key={tenantName}>
                  {directory
                    .filter((dir) => dir.name === item['name'])
                    .map((dir: Service) => (
                      <ServiceItemComponent service={dir} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </tbody>
              </DataTable>
              <br />
            </TableDiv>
          ))}
        </div>
      )}
      {/* Delete confirmation */}
      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete directory entry"
          content={`Delete ${selectedEntry?.namespace} ?`}
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(deleteEntry(selectedEntry));
          }}
        />
      )}
      {editEntry && (
        <DirectoryModal
          open={true}
          entry={selectedEntry}
          type={isEdit ? 'edit' : 'new'}
          onCancel={() => {
            reset();
          }}
        />
      )}
    </>
  );
};

export const NameDiv = styled.div`
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
