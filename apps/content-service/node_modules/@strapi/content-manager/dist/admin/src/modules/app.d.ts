import { GetInitData } from '../../../shared/contracts/init';
import type { ContentManagerLink } from '../hooks/useContentManagerInitData';
interface AppState {
    collectionTypeLinks: ContentManagerLink[];
    components: GetInitData.Response['data']['components'];
    fieldSizes: GetInitData.Response['data']['fieldSizes'];
    models: GetInitData.Response['data']['contentTypes'];
    singleTypeLinks: ContentManagerLink[];
    isLoading: boolean;
}
declare const reducer: import("redux").Reducer<AppState>;
declare const setInitialData: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    authorizedCollectionTypeLinks: AppState['collectionTypeLinks'];
    authorizedSingleTypeLinks: AppState['singleTypeLinks'];
    components: AppState['components'];
    contentTypeSchemas: AppState['models'];
    fieldSizes: AppState['fieldSizes'];
}, "app/setInitialData">;
export { reducer, setInitialData };
export type { AppState };
