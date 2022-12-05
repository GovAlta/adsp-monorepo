import { expectSaga } from 'redux-saga-test-plan';
import { SagaIterator } from '@redux-saga/core';
import { put } from 'redux-saga/effects';
import { FETCH_DIRECTORY_SUCCESS } from './actions';
import { Directory } from './models';
import directoryReducer from './reducers';

it('Can update the directory entry', () => {
  const directory: Directory = {
    directory: [
      {
        namespace: 'platform',
        url: 'https://mock-url.com',
        service: 'directory-service:v3',
      },
    ],
  };
  return expectSaga(runFetchDirectorySuccessReducer, directory)
    .withReducer(directoryReducer)
    .hasFinalState({
      directory: [
        {
          namespace: 'platform',
          url: 'https://mock-url.com',
          service: 'directory-service',
          isCore: true,
          api: 'v3',
        },
      ],
    })
    .run();
});

function* runFetchDirectorySuccessReducer(directory: Directory): SagaIterator {
  yield put({
    type: FETCH_DIRECTORY_SUCCESS,
    payload: directory,
  });
}
