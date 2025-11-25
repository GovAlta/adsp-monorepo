import { Dispatch } from '@reduxjs/toolkit';
import { TypedUseSelectorHook } from 'react-redux';
import { State } from './reducers';
import type { Store } from '@strapi/admin/strapi-admin';
type RootState = ReturnType<Store['getState']> & {
    ['content-manager']: State;
};
declare const useTypedDispatch: () => Dispatch;
declare const useTypedSelector: TypedUseSelectorHook<RootState>;
export { useTypedSelector, useTypedDispatch };
