import type { FetchError } from '@strapi/admin/strapi-admin';
import type { MessageDescriptor } from 'react-intl';
type GetAPIInnerErrorsReturn = {
    [key: string]: MessageDescriptor;
};
/**
 *
 * Returns a normalized error message
 *
 */
export declare function getAPIInnerErrors(error: FetchError, { getTrad }: {
    getTrad: (key: string) => string;
}): string | GetAPIInnerErrorsReturn | undefined;
export {};
