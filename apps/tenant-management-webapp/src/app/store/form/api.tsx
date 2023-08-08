import axios from 'axios';
import { FormDefinition, UpdateFormConfig, DeleteFormConfig } from './model';

export const fetchFormDefinitionsApi = async (token: string, url: string): Promise<Record<string, FormDefinition>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateFormDefinitionApi = async (token: string, url: string, body: UpdateFormConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const deleteFormDefinitionApi = async (token: string, url: string, body: DeleteFormConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
