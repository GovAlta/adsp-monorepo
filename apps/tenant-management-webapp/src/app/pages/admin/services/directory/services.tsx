import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchDirectory } from '@store/directory/actions';
import DataTable from '@components/DataTable';
import { Service, defaultService } from '@store/directory/models';
import styled from 'styled-components';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { DeleteModal } from '@components/DeleteModal';
import { DirectoryModal } from './directoryModal';
import { deleteEntry } from '@store/directory/actions';

export const DirectoryService: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [isEdit, setIsEdit] = useState(false);
  const [editEntry, setEditEntry] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Service>(defaultService);
  useEffect(() => {
    dispatch(fetchDirectory());
  }, []);

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
  return (
    <>
      <PageIndicator />
      {!indicator.show && !nameArray && renderNoItem('directory')}
      {!indicator.show && nameArray && (
        <div>
          {nameArray.map((item) => (
            <TableDiv key={item['name']}>
              <NameDiv>{item['name']}</NameDiv>
              <GoAButton
                data-testid="add-directory-btn"
                onClick={() => {
                  defaultService.name = item['name'];
                  setSelectedEntry(defaultService);
                  setIsEdit(false);
                  setEditEntry(true);
                }}
              >
                Add directory
              </GoAButton>
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

                <tbody key={item['name']}>
                  {directory
                    .filter((dir) => dir.name === item['name'])
                    .map((dir: Service) => {
                      return (
                        <tr key={dir.namespace}>
                          <td headers="namespace" data-testid="namespace">
                            {dir.namespace}
                          </td>
                          <td headers="directory" data-testid="directory">
                            {dir.url}
                          </td>
                          <td className="actionCol">
                            <GoAContextMenu>
                              <GoAContextMenuIcon
                                type="create"
                                title="Edit"
                                testId={`directory-edit-${dir.namespace}`}
                                onClick={() => {
                                  setSelectedEntry(dir);
                                  setIsEdit(true);
                                  setEditEntry(true);
                                }}
                              />
                              <GoAIconButton
                                testId={`directory-delete-${dir.namespace}`}
                                title="Delete"
                                size="medium"
                                type="trash"
                                onClick={() => {
                                  setShowDeleteConfirmation(true);
                                  setSelectedEntry(dir);
                                }}
                              />
                            </GoAContextMenu>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </DataTable>
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
