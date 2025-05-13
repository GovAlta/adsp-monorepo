import React, { useState } from 'react';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { CacheTarget } from '../../../../store/cache/model';
import { OverflowWrap, EntryDetail } from './style-components';
import { IconDiv } from '../task/styled-components';

interface FormDefinitionItemProps {
  target: CacheTarget;
  name: string;
  openModalFunction?: (disposition: CacheTarget) => void;
  onDeleteTarget?: (disposition: CacheTarget) => void;
  tenantMode?: boolean;
}

const CacheTargetDetails = ({ cacheTarget }: { cacheTarget: CacheTarget }) => {
  return <pre>{JSON.stringify(cacheTarget, null, 2)}</pre>;
};

export const CacheTargetItem = ({
  target,
  name,
  openModalFunction,
  onDeleteTarget,
  tenantMode,
}: FormDefinitionItemProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <React.Fragment key={name}>
      <tr>
        <td data-testid="cache-targets-name">
          <OverflowWrap>{name}</OverflowWrap>
        </td>
        <td data-testid="cache-targets-description">
          <OverflowWrap>{target?.ttl}</OverflowWrap>
        </td>
        <td data-testid="cache-targets-action">
          <IconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={() => {
                  setShowDetails(!showDetails);
                }}
                testId="target-toggle-details-visibility"
              />
            </GoAContextMenu>
            {tenantMode && (
              <GoAContextMenu>
                <GoAContextMenuIcon
                  type="create"
                  title="Edit"
                  onClick={() => openModalFunction(target)}
                  testId={`edit-target-item-${target.urn}`}
                />
              </GoAContextMenu>
            )}
            {tenantMode && (
              <GoAContextMenu>
                <GoAContextMenuIcon
                  data-testid="delete-icon"
                  type="trash"
                  onClick={() => onDeleteTarget(target)}
                  testId={`delete-target-item-${target.urn}`}
                />
              </GoAContextMenu>
            )}
          </IconDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={7}
            style={{
              padding: '0px',
            }}
          >
            <EntryDetail data-testid="configuration-details">
              <CacheTargetDetails data-testid="form-definition-details" cacheTarget={target} />
            </EntryDetail>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};
