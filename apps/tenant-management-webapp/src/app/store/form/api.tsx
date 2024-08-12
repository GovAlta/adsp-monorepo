import axios from 'axios';
import { FormDefinition } from './model';

export const fetchFormDefinitionsApi = async (token: string, url: string): Promise<Record<string, FormDefinition>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateFormDefinitionApi = async (token: string, serviceUrl: string, definition: FormDefinition) => {
  // Save to new namespace based configuration.
  const { data } = await axios.patch<{ latest: { configuration: Record<string, FormDefinition> } }>(
    new URL(`configuration/v2/configuration/form-service/${definition.id}`, serviceUrl).href,
    { operation: 'UPDATE', update: definition },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};

export const deleteFormDefinitionApi = async (token: string, serviceUrl: string, definitionId: string) => {
  const { data } = await axios.patch<{ latest: { configuration: Record<string, FormDefinition> } }>(
    new URL('configuration/v2/configuration/platform/form-service', serviceUrl).href,
    { operation: 'DELETE', property: definitionId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Delete from new namespace based configuration.
  await axios.delete<{ latest: { configuration: Record<string, FormDefinition> } }>(
    new URL(`configuration/v2/configuration/form-service/${definitionId.toLowerCase()}`, serviceUrl).href,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};
