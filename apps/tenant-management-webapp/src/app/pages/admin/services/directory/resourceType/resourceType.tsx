import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import { defaultResourceType } from '@store/directory/models';
import { AddEditResourceTypeModal } from './addEditResourceType';
import { ResourceType } from '@store/directory/models';
import { fetchResourceTypeAction, updateResourceTypeAction } from '@store/directory/actions';
import DataTable from '@components/DataTable';
import { NameDiv, EntryDetail } from '../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface ResourceTypeProps {
  resourceType: ResourceType[];
  key?: string;
}

const ResourceTypeComponent: FunctionComponent<ResourceTypeProps> = ({ resourceType }) =>
  resourceType && resourceType.length > 0 && resourceType.map((resource) => <ResourceItem resource={resource} />);
interface ResourceProps {
  resource: ResourceType;
}
const ResourceItem: FunctionComponent<ResourceProps> = (resource) => {
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  const currentResource = resource.resource;
  return (
    <>
      <tr>
        <td headers="type" data-testid="type">
          {currentResource?.type}
        </td>
        <td headers="matcher" data-testid="matcher">
          {currentResource?.matcher}
        </td>
        <td headers="actions" data-testid="actions">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" headers="namespace name description payload" colSpan={5}>
            <EntryDetail>
              <span data-testid="name-path-details">{`Name path: ${currentResource.namePath}`}</span>
              <br />
              {resource.deleteEvent && (
                <span data-testid="delete-event-details">{`Delete event: ${currentResource.deleteEvent.namespace}:${currentResource.deleteEvent.name}`}</span>
              )}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

export const ResourceTypePage = (): JSX.Element => {
  const [openAddResourceType, setOpenAddResourceType] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
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

  return (
    <section>
      <GoAButton
        testId="add-resource-type"
        onClick={() => {
          setOpenAddResourceType(true);
        }}
      >
        Add type
      </GoAButton>
      <br />
      <br />
      <PageIndicator />
      <AddEditResourceTypeModal
        open={openAddResourceType}
        isEdit={false}
        onCancel={reset}
        initialType={defaultResourceType}
        urn=""
        onSave={(type, urn) => {
          dispatch(updateResourceTypeAction(type, urn));
        }}
      />
      <div>
        {groupedResourceTypes &&
          Object.keys(groupedResourceTypes).map((group, value) => (
            <div key={group}>
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
                  <ResourceTypeComponent key={`resource-type-${group}`} resourceType={resourceTypes[group]} />
                </tbody>
              </DataTable>
            </div>
          ))}
      </div>
    </section>
  );
};
