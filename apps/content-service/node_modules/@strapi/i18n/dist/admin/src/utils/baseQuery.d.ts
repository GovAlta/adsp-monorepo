import { SerializedError } from '@reduxjs/toolkit';
import { type ApiError, type UnknownApiError } from '@strapi/admin/strapi-admin';
type BaseQueryError = ApiError | UnknownApiError | SerializedError;
declare const isBaseQueryError: (error: BaseQueryError) => error is ApiError | UnknownApiError;
export { isBaseQueryError };
