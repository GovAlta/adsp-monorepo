import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';

import { getCacheTargets } from '@store/cache/action';

interface CacheTargetProps {
  disabled?: boolean;
}
export const Targets: FunctionComponent<CacheTargetProps> = (props) => {
  const { disabled } = props;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCacheTargets());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cacheTargets = useSelector((state: RootState) => state.cache.targets);

  return (
    <div>
      <p></p>
      Targets are upstream services and APIs that cache service can provide read-through requests to. This configuration
      is a whitelist that restricts the upstream resources available through the cache service API. Targets are
      configured as service or API URNs and must be registered in directory service, and an associated TTL can be set.
      <pre>{JSON.stringify(cacheTargets, null, 2)}</pre>
    </div>
  );
};
