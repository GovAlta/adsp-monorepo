import { createSelector } from 'reselect';
import { RootState } from '../index';

const hasApi = (service, directory) => {
  const filteredDirectory = directory.filter((dir) => dir.service === service.service);
  const api = service.metadata?._links?.api?.href?.split('/').slice(-1)[0];

  return filteredDirectory.length < 2 || !filteredDirectory.find((dir) => dir.api === api);
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

export const selectDirectoryByServiceName = createSelector(
  selectDirectory,
  (_, service: string) => service,
  (directory, service) => {
    return directory.filter((dir) => dir.service === service)?.[0];
  }
);

