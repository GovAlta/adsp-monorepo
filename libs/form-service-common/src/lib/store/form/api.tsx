import axios from 'axios';
import { FormDefinition } from './model';

export const fetchFormDefinitionsApi = async (token: string, url: string): Promise<Record<string, FormDefinition>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const exportApi = async (
  token: string,
  url: string,
  //  eslint-disable-next-line
  requestBody: any
): Promise<Record<string, FormDefinition>> => {
  const res = await axios.post(url, requestBody, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const fetchFormDefinitionApi = async (
  token: string,
  serviceUrl: string,
  definitionId: string
): Promise<FormDefinition> => {
  const { data } = await axios.get<FormDefinition>(
    new URL(`configuration/v2/configuration/form-service/${definitionId}/latest`, serviceUrl).href,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data?.id ? data : null;
};

export const updateFormDefinitionApi = async (token: string, serviceUrl: string, definition: FormDefinition) => {
  // Save to new namespace based configuration.
  const { data } = await axios.patch<{ latest: { configuration: Record<string, FormDefinition> } }>(
    new URL(`configuration/v2/configuration/form-service/${definition.id}`, serviceUrl).href,
    { operation: 'REPLACE', configuration: definition },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};

export const deleteFormDefinitionApi = async (token: string, serviceUrl: string, definitionId: string) => {
  // Delete from new namespace based configuration.
  const { data } = await axios.delete<{ latest: { configuration: Record<string, FormDefinition> } }>(
    new URL(`configuration/v2/configuration/form-service/${definitionId}`, serviceUrl).href,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};
