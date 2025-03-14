import React, { useState, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import { defaultResourceType } from '@store/directory/models';
import { AddEditResourceTypeModal } from './addEditResourceType';
import { ResourceType } from '@store/directory/models';
import { fetchResourceTypeAction, updateResourceTypeAction, deleteResourceTypeAction } from '@store/directory/actions';
import DataTable from '@components/DataTable';

import { TableDiv, NameDiv } from '../../styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { ResourceTypeComponent } from './resourceTypeItem';
import { v4 as uuidv4 } from 'uuid';

export const ResourceTypePage = (): JSX.Element => {
  const [openAddResourceType, setOpenAddResourceType] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const [selectedType, setSelectedType] = useState<ResourceType>(defaultResourceType);
  const [urn, setUrn] = useState('');
  const resourceTypes = useSelector((state: RootState) => state.directory.resourceType);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchResourceTypeAction());
  }, [dispatch]);

  const reset = () => {
    setOpenAddResourceType(false);
  };

  const groupResources = (data: Record<string, ResourceType[]>) => {
    const platformGroup: Record<string, ResourceType[]> = {};
    const othersGroup: Record<string, ResourceType[]> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key.includes(':platform:')) {
        platformGroup[key] = value;
      } else {
        othersGroup[key] = value;
      }
    });

    return { ...othersGroup, ...platformGroup };
  };
  const groupedResourceTypes = resourceTypes && groupResources(resourceTypes);

  const onEdit = (urn, resource) => {
    setOpenAddResourceType(true);
    setSelectedType(resource);

    setUrn(urn);
    setIsEdit(true);
  };
  const onDelete = (urn, resource) => {
    setShowDeleteConfirmation(true);
    setSelectedType(resource);
    setUrn(urn);
  };

  return (
    <section>
      <GoAButton
        testId="add-resource-type"
        onClick={() => {
          setOpenAddResourceType(true);
          setIsEdit(false);
        }}
      >
        Add type
      </GoAButton>
      <br />
      <br />
      <PageIndicator />
      <AddEditResourceTypeModal
        open={openAddResourceType}
        isEdit={isEdit}
        onCancel={reset}
        initialType={isEdit ? selectedType : defaultResourceType}
        urn={urn}
        onSave={(type, urn) => {
          if (resourceTypes && isEdit) {
            //edit resource
            const resourceType = resourceTypes[urn];

            const updatedResourceType = resourceType.map((item) => (item.id === type.id ? type : item));
            dispatch(updateResourceTypeAction(updatedResourceType, urn));
          } else {
            //Add new resource type
            type['id'] = uuidv4();
            if (resourceTypes && Object.keys(resourceTypes).some((key) => key.includes(urn))) {
              const resourceType = resourceTypes[urn];
              dispatch(updateResourceTypeAction([...resourceType, type], urn));
            } else {
              dispatch(updateResourceTypeAction([type], urn));
            }
          }
        }}
      />
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete resource type"
        content={
          <div>
            Are you sure you wish to delete <b> {selectedType?.type}</b>?
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          if (resourceTypes[urn].length > 1) {
            const resourceType = resourceTypes[urn];

            const updatedResourceType = resourceType.filter((item) => item.id !== selectedType.id);
            dispatch(updateResourceTypeAction(updatedResourceType, urn));
          } else {
            dispatch(deleteResourceTypeAction(urn));
          }
        }}
      />

      <div>
        {groupedResourceTypes &&
          Object.keys(groupedResourceTypes).map((group, value) => (
            <TableDiv key={group}>
              <NameDiv>{group}</NameDiv>
              <DataTable data-testid="resource-type-table" id="resource-type-table">
                <thead data-testid="resource-type-table-header">
                  <tr>
                    <th id="type" data-testid="resource-type-table-header-name">
                      Type
                    </th>
                    <th id="description">Matcher</th>
                    <th id="actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <ResourceTypeComponent
                    resourceType={resourceTypes[group]}
                    urn={group}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    index={value}
                  />
                </tbody>
              </DataTable>
            </TableDiv>
          ))}
      </div>
    </section>
  );
};
