import { RootState } from '@store/index';

export const selectIsAuthenticated = (state: RootState) => !!state.session?.authenticated;
export const selectUserName = (state: RootState) => state.session?.userInfo?.name || state.session?.userInfo?.preferredUsername || '';
export const selectUserEmail = (state: RootState) => state.session?.userInfo?.email || '';