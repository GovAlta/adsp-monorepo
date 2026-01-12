import React, { FunctionComponent, useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { NoPaddingH2 } from '@components/AppHeader';
import { GoabButton } from '@abgov/react-components';

interface CacheOverviewProps {
  setOpenAddDefinition: (val: boolean) => void;
  setActiveIndex: (number) => void;
}
export const CacheOverview: FunctionComponent<CacheOverviewProps> = ({
  setOpenAddDefinition,
  setActiveIndex,
}: CacheOverviewProps) => {
  useEffect(() => {
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const description = `Cache service provides a read-through cache to upstream targets. Unlike generic HTTP shared cache solutions, the cache service is integrated into the ADSP multi-tenant security layer and user context aware. This allows it to cache resources protected by role-based access control (RBAC) using user-specific cache entries.`;

  return (
    <div>
      <section>
        <p>{description}</p>
        <NoPaddingH2>Cache targets</NoPaddingH2>

        <p>
          Targets are upstream services and APIs that cache service can provide read-through requests to. This
          configuration is a whitelist that restricts the upstream resources available through the cache service API.
          Targets are configured as service or API URNs and must be registered in directory service, and an associated
          TTL can be set.
        </p>
        <GoabButton
          testId="add-cache-target"
          onClick={() => {
            setActiveIndex(1);
            setOpenAddDefinition(true);
          }}
        >
          Add cache target
        </GoabButton>
      </section>
    </div>
  );
};
