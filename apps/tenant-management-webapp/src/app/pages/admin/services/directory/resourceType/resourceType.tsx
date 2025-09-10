import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import { defaultResourceType, ResourceType } from '@store/directory/models';
import { AddEditResourceTypeModal } from './addEditResourceType';
import { fetchResourceTypeAction, updateResourceTypeAction, deleteResourceTypeAction } from '@store/directory/actions';
import DataTable from '@components/DataTable';
import { TableDiv, NameDiv } from '../../styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { ResourceTypeComponent } from './resourceTypeItem';
import { v4 as uuidv4 } from 'uuid';
import { renderNoItem } from '@components/NoItem';
export const ResourceTypePage = (): JSX.Element => {
  const [openAddResourceType, setOpenAddResourceType] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [selectedType, setSelectedType] = useState<ResourceType>(defaultResourceType);
  const [urn, setUrn] = useState('');
  const resourceTypes = useSelector((state: RootState) => state.directory.resourceType);
  const resourceTypesInCore = useSelector((state: RootState) => state.directory.resourceTypeInCore);
  const platformGroup: Record<string, ResourceType[]> = {};
  const othersGroup: Record<string, ResourceType[]> = {};

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchResourceTypeAction());
  }, [dispatch]);

  const reset = useCallback(() => {
    setOpenAddResourceType(false);
    setSelectedType(defaultResourceType);
  }, []);

  const groupResources = (data: Record<string, ResourceType[]>) => {
    Object.entries(data).forEach(([key, value]) => {
      if (key.includes(':platform:')) {
        platformGroup[key] = value;
      } else {
        othersGroup[key] = value;
      }
    });
  };

  const groupedResourceTypes = useMemo(
    () => resourceTypes && groupResources(resourceTypes),
    [resourceTypes, groupResources]
  );

  const onEdit = (urn: string, resource: ResourceType) => {
    setOpenAddResourceType(true);
    setSelectedType(resource);
    setUrn(urn);
    setIsEdit(true);
  };

  const onDelete = (urn: string, resource: ResourceType) => {
    setShowDeleteConfirmation(true);
    setSelectedType(resource);
    setUrn(urn);
  };

  const handleSave = (type: ResourceType, urn: string) => {
    if (resourceTypes && isEdit) {
      const resourceType = resourceTypes[urn];
      const updatedResourceType = resourceType.map((item) => (item.id === type.id ? type : item));
      dispatch(updateResourceTypeAction(updatedResourceType, urn));
    } else {
      type['id'] = uuidv4();
      if (resourceTypes && Object.keys(resourceTypes).some((key) => key.includes(urn))) {
        const resourceType = resourceTypes[urn];
        dispatch(updateResourceTypeAction([...resourceType, type], urn));
      } else {
        dispatch(updateResourceTypeAction([type], urn));
      }
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(false);
    if (resourceTypes[urn].length > 1) {
      const resourceType = resourceTypes[urn];
      const updatedResourceType = resourceType.filter((item) => item.id !== selectedType.id);
      dispatch(updateResourceTypeAction(updatedResourceType, urn));
    } else {
      dispatch(deleteResourceTypeAction(urn));
    }
    reset();
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
        initialType={selectedType}
        initialDeleteEvent={isEdit ? `${selectedType?.deleteEvent.namespace}:${selectedType.deleteEvent.name}` : ''}
        urn={isEdit ? urn : ''}
        onSave={handleSave}
      />
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete resource type"
        content={
          <div>
            Are you sure you wish to delete <b> {selectedType?.type}</b>?
          </div>
        }
        onCancel={() => {
          setShowDeleteConfirmation(false);
        }}
        onDelete={handleDelete}
      />
      {Object.keys(othersGroup)?.length === 0 && renderNoItem('tenant resource type')}
      {othersGroup && Object.keys(othersGroup)?.length > 0 && (
        <div>
          <GroupedResourceTypesTable
            groupedResourceTypes={othersGroup}
            resourceTypes={resourceTypes}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
      {Object.keys(resourceTypesInCore)?.length === 0 && renderNoItem('Core resource types')}
      {resourceTypesInCore && Object.keys(resourceTypesInCore)?.length > 0 && (
        <div>
          <h2>Core resource types</h2>
          <GroupedResourceTypesTable groupedResourceTypes={resourceTypesInCore} resourceTypes={resourceTypesInCore} />
        </div>
      )}
    </section>
  );
};

interface GroupedResourceTypesTableProps {
  groupedResourceTypes: Record<string, ResourceType[]>;
  resourceTypes: Record<string, ResourceType[]>;
  onEdit?: (urn: string, resource: ResourceType) => void;
  onDelete?: (urn: string, resource: ResourceType) => void;
}

const GroupedResourceTypesTable: React.FC<GroupedResourceTypesTableProps> = ({
  groupedResourceTypes,
  resourceTypes,
  onEdit,
  onDelete,
}) => {
  if (!groupedResourceTypes) return null;

  return (
    <>
      {Object.keys(groupedResourceTypes).map((group) => (
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
              />
            </tbody>
          </DataTable>
        </TableDiv>
      ))}
    </>
  );
};
