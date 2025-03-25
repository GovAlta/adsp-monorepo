import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { CacheTargetTable } from './targetsList';
import { getCacheTargets, updateCacheTarget } from '@store/cache/action';
import { Padding } from '@components/styled-components';
import { AddEditTargetCache } from './addEditCacheTarget';
import { defaultCacheTarget } from '@store/cache/model';
import { GoAButton } from '@abgov/react-components';

interface CacheTargetProps {
  openAddDefinition: boolean;
  setOpenAddDefinition: (val: boolean) => void;
}
export const Targets: FunctionComponent<CacheTargetProps> = ({
  openAddDefinition,
  setOpenAddDefinition,
}: CacheTargetProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCacheTargets());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cacheTargets = useSelector((state: RootState) => state.cache.targets);
  const [currentDefinition, setCurrentDefinition] = useState(defaultCacheTarget);

  return (
    <div>
      <Padding>
        Targets are upstream services and APIs that cache service can provide read-through requests to. This
        configuration is a whitelist that restricts the upstream resources available through the cache service API.
        Targets are configured as service or API URNs and must be registered in directory service, and an associated TTL
        can be set.
      </Padding>
      <GoAButton
        testId="add-definition"
        onClick={() => {
          setOpenAddDefinition(true);
        }}
        mb={'l'}
      >
        Add cache targets
      </GoAButton>
      {cacheTargets && <CacheTargetTable targets={cacheTargets} />}
      <AddEditTargetCache
        open={openAddDefinition}
        isEdit={false}
        onClose={() => {
          setOpenAddDefinition(false);
        }}
        initialValue={defaultCacheTarget}
        onSave={(definition) => {
          setOpenAddDefinition(false);
          dispatch(updateCacheTarget(definition));
        }}
      />
    </div>
  );
};
