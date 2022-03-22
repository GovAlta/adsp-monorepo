import React, { FunctionComponent, useState } from 'react';

import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { Service } from '@store/directory/models';
import { useDispatch } from 'react-redux';
import { fetchEntryDetail } from '@store/directory/actions';
import { renderNoItem } from '@components/NoItem';

interface serviceProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export const ServiceItemComponent: FunctionComponent<serviceProps> = ({ service, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const dispatch = useDispatch();

  const setDetails = (service: Service) => {
    if (!showDetails) {
      dispatch(fetchEntryDetail(service));
    }
    setShowDetails(!showDetails);
  };

  return (
    <>
      <tr key={service.namespace}>
        <td headers="namespace" data-testid="namespace">
          {service.namespace}
        </td>
        <td headers="directory" data-testid="directory">
          {service.url}
        </td>
        <td className="actionCol">
          <GoAContextMenu>
            {service.namespace.split(':').length === 1 && (
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
                testId={`directory-edit-${service.namespace}`}
                onClick={() => {
                  onEdit(service);
                }}
              />
            )}
            {!service.isCore && (
              <GoAIconButton
                testId={`directory-delete-${service.namespace}`}
                title="Delete"
                size="medium"
                type="trash"
                onClick={() => {
                  onDelete(service);
                }}
              />
            )}
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td headers="Entry metadata information" colSpan={5}>
            {service.metadata === null ? (
              renderNoItem('service metadata')
            ) : (
              <EntryDetail data-testid="details">{JSON.stringify(service.metadata, null, 4)}</EntryDetail>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
`;
