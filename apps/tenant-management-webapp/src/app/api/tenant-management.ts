import axios from 'axios';
import { fetchConfig } from '../utils/useConfig';

export default function tenantManagementApi(endpoint) {
  return fetchApi(endpoint);
}

async function fetchApi(endpoint) {
  const config = await fetchConfig();
  return axios.get(`${config.tenantManagementApi}/${endpoint}`)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    })
}
