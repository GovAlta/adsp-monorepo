import { expectSaga } from 'redux-saga-test-plan';
import { fetchDirectory } from './sagas';
import { FETCH_DIRECTORY_SUCCESS } from './actions';
import * as API from './api';

it('Can run fetch directory', () => {
  const storeState = {
    config: {
      serviceUrls: {
        directoryServiceApiUrl: 'http://mock-directory-host.com',
      },
    },
    session: {
      credentials: {
        tokenExp: Date.now() / 1000 + 1000,
        token: 'mock-token',
      },
    },
  };

  const mockDirectory = [
    {
      namespace: 'platform',
    },
  ];
  return expectSaga(fetchDirectory)
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === API.fetchDirectories) {
          return mockDirectory;
        }
        return next();
      },
    })
    .put.like({
      action: {
        type: FETCH_DIRECTORY_SUCCESS,
        payload: { directory: [...mockDirectory] },
      },
    })
    .put.like({
      action: { type: 'session/indicator', payload: { show: false } },
    })
    .run();
});

it('Can skip fetch directory call when token is not available', () => {
  const storeState = {
    config: {
      serviceUrls: {
        directoryServiceApiUrl: null,
      },
    },
    session: {
      credentials: {
        tokenExp: Date.now() / 1000 + 1000,
        token: null,
      },
    },
  };

  return expectSaga(fetchDirectory).withState(storeState).not.call.fn(API.fetchDirectories).run();
});
