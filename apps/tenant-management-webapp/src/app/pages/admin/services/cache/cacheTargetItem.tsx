import React, { useState } from 'react';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { CacheTarget } from '../../../../store/cache/model';
import { OverflowWrap, EntryDetail } from './style-components';

interface FormDefinitionItemProps {
  target: CacheTarget;
  name: string;
}

const CacheTargetDetails = ({ cacheTarget }: { cacheTarget: CacheTarget }) => {
  return <pre>{JSON.stringify(cacheTarget, null, 2)}</pre>;
};

export const CacheTargetItem = ({ target, name }: FormDefinitionItemProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <React.Fragment key={target.urn}>
      <tr>
        <td data-testid="cache-targets-name">
          <OverflowWrap>{name}</OverflowWrap>
        </td>
        <td data-testid="cache-targets-description">
          <OverflowWrap>{target?.ttl}</OverflowWrap>
        </td>
        <td data-testid="cache-targets-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => {
                setShowDetails(!showDetails);
              }}
              testId="cache-toggle-details-visibility"
            />
          </GoAContextMenu>
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
