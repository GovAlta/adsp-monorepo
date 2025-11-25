import { FetchResponse } from '@strapi/admin/strapi-admin';
import { UseMutationResult } from 'react-query';
import type { DeleteFile } from '../../../shared/contracts/files';
type UseRemoveAsset = {
    removeAsset: (assetId: number) => Promise<void>;
} & UseMutationResult<FetchResponse<DeleteFile.Response>, Error, number>;
export declare const useRemoveAsset: (onSuccess: () => void) => UseRemoveAsset;
export {};
