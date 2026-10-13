import axios from 'axios';
import { RegisterConfigData, RegisterDataType } from '@abgov/jsonforms-components';
import { DATA_REGISTER_NAMESPACE } from './model';

export interface DataRegisterResponse {
  namespace: string;
  name: string;
  description: string;
  entries: RegisterDataType;
}

export interface CreateDataRegisterRequest {
  name: string;
  description?: string;
  entries?: RegisterDataType;
}

export interface UpdateDataRegisterRequest {
  description?: string;
  entries?: RegisterDataType;
}

// The URN is deliberately left unencoded: jsonforms resolves registers by exact URN match and saved forms embed it.
export const toRegisterConfigData = (register: DataRegisterResponse): RegisterConfigData => ({
  urn: `urn:ads:platform:configuration:v2:/configuration/${DATA_REGISTER_NAMESPACE}/${register.name}`,
  description: register.description,
  data: register.entries,
});

export const fetchRegistersApi = async (token: string, url: string): Promise<RegisterConfigData[]> => {
  const { data } = await axios.get<DataRegisterResponse[]>(new URL('form/v1/registers', url).href, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.map(toRegisterConfigData);
};

export const createRegisterApi = async (
  token: string,
  url: string,
  request: CreateDataRegisterRequest,
): Promise<RegisterConfigData> => {
  const { data } = await axios.post<DataRegisterResponse>(new URL('form/v1/registers', url).href, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return toRegisterConfigData(data);
};

export const updateRegisterApi = async (
  token: string,
  url: string,
  name: string,
  request: UpdateDataRegisterRequest,
): Promise<RegisterConfigData> => {
  const { data } = await axios.patch<DataRegisterResponse>(
    new URL(`form/v1/registers/${encodeURIComponent(name)}`, url).href,
    request,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return toRegisterConfigData(data);
};

export const deleteRegisterApi = async (token: string, url: string, name: string): Promise<void> => {
  await axios.delete(new URL(`form/v1/registers/${encodeURIComponent(name)}`, url).href, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
