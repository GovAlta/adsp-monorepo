import { createSelector } from '@reduxjs/toolkit';
import { AppState } from '../store';

export const selectUser = (state: AppState) => state.user.user;

export const selectIsAuthenticated = createSelector(selectUser, (user): boolean => !!user);

export const selectUserName = createSelector(selectUser, (user): string | undefined => user?.name);

export const selectUserEmail = createSelector(selectUser, (user): string | undefined => user?.email);

export const selectUserRoles = createSelector(selectUser, (user): string[] => user?.roles || []);

export const selectTenant = (state: AppState) => state.user.tenant;
