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
  resourceType: ResourceType;
}

const ResourceTypeComponent: FunctionComponent<ResourceTypeProps> = ({ resourceType }) => {
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  return (
    <>
      <tr>
        <td headers="type" data-testid="type">
          {resourceType.type}
        </td>
        <td headers="matcher" data-testid="matcher">
          {resourceType.matcher}
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
              <span data-testid="name-path-details">{`Name path: ${resourceType.namePath}`}</span>
              <br />
              {resourceType.deleteEvent && (
                <span data-testid="delete-event-details">{`Delete event: ${resourceType.deleteEvent.namespace}:${resourceType.deleteEvent.name}`}</span>
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
        onSave={(type) => {
          dispatch(updateResourceTypeAction(type, type.type));
        }}
      />
      <div>
        {Object.keys(resourceTypes).map((group, value) => (
          <div key={group}>
            <NameDiv>{group}</NameDiv>
            <DataTable data-testid="resource-type-table">
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
                <ResourceTypeComponent resourceType={resourceTypes[group]} />
              </tbody>
            </DataTable>
          </div>
        ))}
      </div>
    </section>
  );
};
