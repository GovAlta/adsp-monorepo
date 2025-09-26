import axios from 'axios';
import {
  FetchConfigurationDefinitionsAction,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  getConfigurationDefinitionsSuccess,
  FETCH_REGISTER_DATA_ACTION,
  getRegisterDataAction,
  getRegisterDataSuccessAction,
  FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
} from './action';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '../session/actions';
import { RootState } from '..';
import { select, call, put, takeEvery, all, take } from 'redux-saga/effects';
import { ErrorNotification } from '../notifications/actions';
import { getAccessToken } from '../tenant/sagas';
import { RegisterConfigData } from '@abgov/jsonforms-components';
import { AdspId } from '../../components/adspId';

export function* fetchConfigurationDefinitions(_action: FetchConfigurationDefinitionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const { tenant, core } = yield all({
        tenant: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/configuration-service`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        core: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/configuration-service?core`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      });

      yield put(
        getConfigurationDefinitionsSuccess({
          tenant: {
            ...tenant.data,
            latest: { ...tenant.data?.latest, configuration: tenant.data?.latest?.configuration },
          },
          core: {
            ...core.data,
            latest: { ...core.data?.latest, configuration: core.data?.latest?.configuration },
          },
        })
      );
      yield put(
        UpdateIndicator({
          show: false,
        })
      );

      yield put(getRegisterDataAction());
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}




export function* fetchRegisterData(): SagaIterator {
  try {
    take(FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION);

    const configBaseUrl: string = yield select(
      (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
    );

    const tenantId: AdspId = yield select((state: RootState) => state.tenant.id);

    const tenantConfigDefinition = yield select(
      (state: RootState) => state?.configuration?.tenantConfigDefinitions?.configuration || {}
    );

    const tenantConfigs = Object.entries(tenantConfigDefinition);

    const registerConfigs =
      tenantConfigs
        // eslint-disable-next-line
        .filter(([name, config]) => {
          // eslint-disable-next-line
          const _c = config as any;
          return (
            _c?.configurationSchema?.type === 'array' &&
            _c.anonymousRead === true &&
            (_c?.configurationSchema?.items?.type === 'string' ||
              (_c?.configurationSchema?.items?.type === 'object' &&
                _c?.configurationSchema?.items?.properties?.label?.type === 'string' &&
                _c?.configurationSchema?.items?.properties?.value?.type === 'string'))
          );
        })
        // eslint-disable-next-line
        .map(([name, config]) => name) || [];

    const dataListObject = tenantConfigs
      // eslint-disable-next-line
      .filter(([name, config]) => {
        // eslint-disable-next-line
        const _c = config as any;
        return (
          _c?.configurationSchema?.type === 'array' &&
          (_c?.configurationSchema?.items?.type === 'string' ||
            (_c?.configurationSchema?.items?.type === 'object' &&
              _c?.configurationSchema?.items?.properties?.label?.type === 'string' &&
              _c?.configurationSchema?.items?.properties?.value?.type === 'string'))
        );
      });

    const registerData: RegisterConfigData[] = [];

    const dataList = dataListObject.map(([name]) => name.replace(':', '/')) || [];

    const anonymousRead =
      dataListObject
        .filter(([name, config]) => {
          // eslint-disable-next-line
          const _c = config as any;

          return _c.anonymousRead !== true;
        })
        .map(([name, config]) => name.replace(':', '/')) || [];

    for (const registerConfig of registerConfigs) {
      try {
        const [namespace, service] = registerConfig.split(':');
        const url = `${configBaseUrl}/configuration/v2/configuration/${namespace}/${service}/active`;
        const { data } = yield call(axios.get, url, { params: { orLatest: true, tenant: tenantId } });

        if (data?.configuration && data?.configuration) {
          registerData.push({
            urn: `urn:ads:platform:configuration:v2:/configuration/${namespace}/${service}`,
            data: data?.configuration,
          });
        }

        yield put(getRegisterDataSuccessAction(registerData, dataList, anonymousRead));
      } catch (error) {
        console.warn(`Error in fetching the register data from service: ${registerConfig}`);
      }
    }
  } catch (error) {
    console.warn(`Error in fetching the register data from service: ${error}`);
  }
}





export function* watchConfigurationSagas(): Generator {
  yield takeEvery(FETCH_CONFIGURATION_DEFINITIONS_ACTION, fetchConfigurationDefinitions);

  yield takeEvery(FETCH_REGISTER_DATA_ACTION, fetchRegisterData);
}
