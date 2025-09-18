import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { DeleteModalType, EditModalType, AddModalType } from './models';
import { selectModalStateByType, selectTenantKebabName } from '@store/session/selectors';
import { ModalState } from '@store/session/models';
import { defaultService } from './models';

const coreRealm = 'platform';

const hasApi = (service, directory) => {
  const filteredDirectory = directory.filter((dir) => dir.service === service.service);
  const api = service.metadata?._links?.api?.href?.split('/').slice(-1)[0];

  return filteredDirectory.length < 2 || !filteredDirectory.find((dir) => dir.api === api);
};

const quickAdd = (service) => {
  const shortCutService = {};
  shortCutService['namespace'] = service.namespace;
  shortCutService['service'] = service.service;
  shortCutService['url'] = service.metadata?._links.api.href;
  shortCutService['api'] = service.metadata?._links.api.href.split('/').slice(-1)[0];
  return shortCutService;
};

export const selectDirectory = createSelector(
  (state: RootState) => state.directory,
  (directory) => {
    return (
      directory?.directory?.map((dir) => {
        return { ...dir, hasApi: hasApi(dir, directory?.directory) };
      }) || []
    );
  }
);

export const selectDirectoryByUrn = createSelector(
  selectDirectory,
  (_, urn: string) => urn,
  (directory, urn) => {
    return directory.filter((dir) => dir.urn === urn)?.[0];
  }
);

export const selectDirectoryByServiceName = createSelector(
  selectDirectory,
  (_, service: string) => service,
  (directory, service) => {
    return directory.filter((dir) => dir.service === service)?.[0];
  }
);

export const selectDirectoryDeleteDirectory = createSelector(
  selectModalStateByType(DeleteModalType),
  (state) => state,
  (modal: ModalState, state) => {
    return selectDirectoryByUrn(state, modal?.id);
  }
);

export const selectEditDirectory = createSelector(
  selectModalStateByType(EditModalType),
  (state) => state,
  (modal: ModalState, state) => {
    return selectDirectoryByUrn(state, modal?.id);
  }
);

export const selectAddDirectory = createSelector(
  selectModalStateByType(AddModalType),
  (state) => state,
  (modal: ModalState, state) => {
    if (!modal.isOpen) return null;
    if (!modal.id) return null;
    return selectDirectoryByUrn(state, modal?.id);
  }
);

export const selectEditAddDirectory = createSelector(
  selectEditDirectory,
  selectAddDirectory,
  selectTenantKebabName,
  (editDir, addDir, tenantName) => {
    if (editDir) return editDir;
    if (addDir) return quickAdd(addDir);
    return {
      ...defaultService,
      namespace: tenantName,
    };
  }
);

export const selectDirectoryByNamespace = createSelector(
  selectDirectory,
  (_, namespace) => namespace,
  (directory, namespace) => {
    return directory
      .filter((dir) => {
        return dir.namespace === namespace;
      })
      .sort((a, b) => (a.service < b.service ? -1 : 1));
  }
);

export const selectSortedDirectory = createSelector(
  selectTenantKebabName,
  (state) => state,
  (tenantNamespace: string, state) => {
    return {
      tenantDirectory:
        tenantNamespace.toLowerCase() === coreRealm ? null : selectDirectoryByNamespace(state, tenantNamespace),
      coreDirectory: selectDirectoryByNamespace(state, coreRealm),
    };
  }
);

export const selectedResourceType = createSelector(
  (state: RootState) => state.directory,
  (directory) => directory?.resourceType
);
