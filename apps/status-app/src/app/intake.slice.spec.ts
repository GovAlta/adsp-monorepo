import { fetchIntake, intakeAdapter, intakeReducer } from './intake.slice';

describe('intake reducer', () => {
  it('should handle initial state', () => {
    const expected = intakeAdapter.getInitialState({
      loadingStatus: 'not loaded',
      error: null,
    });

    expect(intakeReducer(undefined, { type: '' })).toEqual(expected);
  });

  it('should handle fetchIntakes', () => {
    let state = intakeReducer(undefined, fetchIntake.pending(null, null));

    expect(state).toEqual(
      expect.objectContaining({
        loadingStatus: 'loading',
        error: null,
        entities: {},
      })
    );

    state = intakeReducer(state, fetchIntake.fulfilled([{ id: 1 }], null, null));

    expect(state).toEqual(
      expect.objectContaining({
        loadingStatus: 'loaded',
        error: null,
        entities: { 1: { id: 1 } },
      })
    );

    state = intakeReducer(state, fetchIntake.rejected(new Error('Uh oh'), null, null));

    expect(state).toEqual(
      expect.objectContaining({
        loadingStatus: 'error',
        error: 'Uh oh',
        entities: { 1: { id: 1 } },
      })
    );
  });
});
