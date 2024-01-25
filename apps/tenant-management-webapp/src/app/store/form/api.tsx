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

export const updateFormData = async (token: string, id: string, data: any) => {
  console.log(JSON.stringify(token) + '<-token');
  console.log(JSON.stringify(id) + '<-id');
  console.log(JSON.stringify(data) + '<-data');
  const response = await axios.get(`http://localhost:3347/form/v1/forms?criteria={"definitionIdEquals":"${id}"}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(JSON.stringify(response) + '<-response');
  const formId = response.data.results[0].id;
  console.log(JSON.stringify(formId) + '<-formId');

  const { FileUploader, FileUploader2, ...formattedData } = data;

  const newData = {} as any;
  newData.data = formattedData;
  newData.files = { [FileUploader]: FileUploader, [FileUploader2]: FileUploader2 };
  console.log(JSON.stringify(newData) + '<-newData');
  const updateResponse = await axios.put(`http://localhost:3347/form/v1/forms/${formId}/data`, newData, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(JSON.stringify(updateResponse) + '<-updateResponse');

  return updateResponse.data;
};
