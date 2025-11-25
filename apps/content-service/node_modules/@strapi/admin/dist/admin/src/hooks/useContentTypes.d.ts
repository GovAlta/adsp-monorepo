import type { ContentType } from '../../../shared/contracts/content-types';
export declare function useContentTypes(): {
    isLoading: boolean;
    collectionTypes: ContentType[];
    singleTypes: ContentType[];
};
