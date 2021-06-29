import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

export const INTAKE_FEATURE_KEY = 'intake';

/*
 * Update these interfaces according to your requirements.
 */
export interface IntakeEntity {
  id: number;
}

export interface IntakeState extends EntityState<IntakeEntity> {
  loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
  error: string | null | undefined;
}

export const intakeAdapter = createEntityAdapter<IntakeEntity>();

/**
 * Export an effect using createAsyncThunk from
 * the Redux Toolkit: https://redux-toolkit.js.org/api/createAsyncThunk
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(fetchIntake())
 * }, [dispatch]);
 * ```
 */
export const fetchIntake = createAsyncThunk('intake/fetchStatus', async (_, thunkAPI) => {
  /**
   * Replace this with your custom fetch call.
   * For example, `return myApi.getIntakes()`;
   * Right now we just return an empty array.
   */
  return Promise.resolve([]);
});

export const initialIntakeState: IntakeState = intakeAdapter.getInitialState({
  loadingStatus: 'not loaded',
  error: null,
});

export const intakeSlice = createSlice({
  name: INTAKE_FEATURE_KEY,
  initialState: initialIntakeState,
  reducers: {
    add: intakeAdapter.addOne,
    remove: intakeAdapter.removeOne,
    // ...
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntake.pending, (state: IntakeState) => {
        state.loadingStatus = 'loading';
      })
      .addCase(fetchIntake.fulfilled, (state: IntakeState, action: PayloadAction<IntakeEntity[]>) => {
        intakeAdapter.setAll(state, action.payload);
        state.loadingStatus = 'loaded';
      })
      .addCase(fetchIntake.rejected, (state: IntakeState, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message;
      });
  },
});

/*
 * Export reducer for store configuration.
 */
export const intakeReducer = intakeSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(intakeActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const intakeActions = intakeSlice.actions;

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllIntake);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities } = intakeAdapter.getSelectors();

export const getIntakeState = (rootState: any): IntakeState => rootState[INTAKE_FEATURE_KEY];

export const selectAllIntake = createSelector(getIntakeState, selectAll);

export const selectIntakeEntities = createSelector(getIntakeState, selectEntities);
