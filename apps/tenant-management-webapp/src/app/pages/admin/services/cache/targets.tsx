import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { CacheTargetTable } from './targetsList';
import { getCacheTargets, updateCacheTarget } from '@store/cache/action';
import { Padding } from '@components/styled-components';
import { AddEditTargetCache } from './addEditCacheTarget';
import { defaultCacheTarget } from '@store/cache/model';
import { GoabButton } from '@abgov/react-components';
import { DeleteModal } from '@components/DeleteModal';
import { CacheTarget } from '@store/cache/model';
import { renderNoItem } from '@components/NoItem';

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

  const [currentTarget, setCurrentTarget] = useState(defaultCacheTarget);
  const [isEdit, setIsEdit] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);

  return (
    <div>
      <Padding>
        Targets are upstream services and APIs that cache service can provide read-through requests to. This
        configuration is a whitelist that restricts the upstream resources available through the cache service API.
        Targets are configured as service or API URNs and must be registered in directory service, and an associated TTL
        can be set.
      </Padding>
      <GoabButton
        testId="add-cache-target"
        onClick={() => {
          setOpenAddDefinition(true);
          setIsEdit(false);
        }}
        mb={'l'}
      >
        Add cache target
      </GoabButton>
      {Object.keys(cacheTargets.tenant).length === 0 && renderNoItem('tenant cache')}
      {cacheTargets?.tenant && Object.keys(cacheTargets.tenant).length > 0 && (
        <CacheTargetTable
          targets={cacheTargets.tenant}
          openModalFunction={(cacheTarget) => {
            setIsEdit(true);
            setCurrentTarget(cacheTarget);
            setOpenAddDefinition(true);
          }}
          onDeleteTarget={(cacheTarget) => {
            setShowDeleteConfirmation(cacheTarget);
          }}
          tenantMode={true}
        />
      )}

      {Object.keys(cacheTargets.core).length === 0 && renderNoItem('core cache')}
      {cacheTargets?.core && Object.keys(cacheTargets.core).length > 0 && (
        <>
          <h2>Core cache targets</h2>
          <CacheTargetTable targets={cacheTargets.core} />
        </>
      )}
      <AddEditTargetCache
        open={openAddDefinition}
        isEdit={isEdit}
        onClose={() => {
          setOpenAddDefinition(false);
        }}
        currentValue={currentTarget}
        onSave={(target) => {
          setOpenAddDefinition(false);
          const updatedCacheTargets = JSON.parse(JSON.stringify(cacheTargets.tenant)) as Record<string, CacheTarget>;
          updatedCacheTargets[target.urn] = target;
          dispatch(updateCacheTarget(updatedCacheTargets));
        }}
      />
      <DeleteModal
        isOpen={showDeleteConfirmation !== null}
        title="Delete cache target"
        content={
          <div>
            Are you sure you wish to delete <b>{showDeleteConfirmation?.urn}</b>?
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(null)}
        onDelete={() => {
          setOpenAddDefinition(false);
          const updatedCacheTargets = JSON.parse(JSON.stringify(cacheTargets.tenant)) as Record<string, CacheTarget>;
          delete updatedCacheTargets[showDeleteConfirmation.urn];
          dispatch(updateCacheTarget(updatedCacheTargets));
          setShowDeleteConfirmation(null);
        }}
      />
    </div>
  );
};
