import React, { FunctionComponent } from 'react';

export const ConfigurationOverview: FunctionComponent = () => {
  return (
    <div>
      <p>
        The configuration service provides a generic json document store for storage and revisioning of infrequently
        changing configuration. Store configuration against namespace and name keys, and optionally define configuration
        schemas for write validation.
      </p>
    </div>
  );
};
