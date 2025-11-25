import { SerializedError } from '@reduxjs/toolkit';
import { ApiError } from '@strapi/admin/strapi-admin';
type BaseQueryError = ApiError | SerializedError;
declare const isBaseQueryError: (error?: BaseQueryError) => error is BaseQueryError;
export { isBaseQueryError };
export type { BaseQueryError };
