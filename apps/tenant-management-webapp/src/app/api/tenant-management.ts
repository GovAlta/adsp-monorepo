import axios from 'axios';
import env from '../../env'

export default function tenantManagementApi (endpoint) {
  return fetchApi(env().tenantManagementApi, endpoint);
}

async function fetchApi(cfg,endpoint) {
  return axios.get(`${cfg}${endpoint}`)
  .then(function (response) {
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  })
}
