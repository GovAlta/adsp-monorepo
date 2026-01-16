import React, { FunctionComponent, useState } from 'react';
import { ResourceType } from '@store/directory/models';
import { EntryDetail, ActionIconsDiv } from '../../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface ResourceTypeProps {
  resourceType: ResourceType[];
  urn?: string;
  onEdit?: (urn: string, rt: ResourceType) => void;
  onDelete?: (urn: string, rt: ResourceType) => void;
}

export const ResourceTypeComponent: FunctionComponent<ResourceTypeProps> = ({
  urn,
  resourceType,
  onEdit,
  onDelete,
}) => (
  <>
    {resourceType.map((resource,index) => (
      <ResourceItem key={index} urn={urn} resource={resource} onEdit={onEdit} onDelete={onDelete} />
    ))}
  </>
);

interface ResourceProps {
  urn?: string;
  resource: ResourceType;
  onEdit?: (urn: string, rt: ResourceType) => void;
  onDelete?: (urn: string, rt: ResourceType) => void;
}

const ResourceItem: FunctionComponent<ResourceProps> = ({ urn, resource, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => setShowDetails((prev) => !prev);

  return (
    <>
      <tr>
        <td headers="type" data-testid="type">
          {resource.type}
        </td>
        <td headers="matcher" data-testid="matcher">
          {resource.matcher}
        </td>
        <td headers="actions" data-testid="actions">
          <ActionIconsDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={toggleDetails}
                testId="toggle-details-visibility"
              />
            </GoAContextMenu>
            {onEdit && (
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                testId={`edit-resource-type-${resource.type}`}
                onClick={() => urn && onEdit(urn, resource)}
              />
            )}
            {onDelete && (
              <GoAContextMenuIcon
                type="trash"
                title="Delete"
                testId="delete-resource-type"
                onClick={() => urn && onDelete(urn, resource)}
              />
            )}
          </ActionIconsDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" headers="namespace name description payload" colSpan={5}>
            <EntryDetail>
              <span data-testid="name-path-details">Name path: {resource.namePath}</span>
              <br />
              {resource.deleteEvent && (
                <span data-testid="delete-event-details">
                  Delete event: {resource.deleteEvent.namespace}:{resource.deleteEvent.name}
                </span>
              )}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};
