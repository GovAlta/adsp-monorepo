import { logger } from '../../../middleware/logger'
import * as request from 'request';
import * as _ from 'lodash';

const FILE_SERVICE_HOST = process.env.FILE_SERVICE_HOST || 'localhost:3337';

const fileHttpHelper = (payload, resolve, reject) => {
  return request(payload, (err, res) => {
    if (_.get(res, 'statusCode') == 200) {
      let data = {}
      if (typeof res.body === 'string') {
        data = JSON.parse(res.body)
      } else {
        data = res.body
      }
      resolve({
        success: true,
        data: data
      })
    } else {
      const errorMessage = "Error sending request to file service";
      logger.error(errorMessage)
      reject({
        errors: [
          errorMessage,
          err
        ]
      })
    }
  })
}

export const fetchSpaceTypes = (spaceId, token) => {
  return new Promise((resolve, reject) => {
    const url = `${FILE_SERVICE_HOST}/file-admin/v1/${spaceId}/types`
    const payload = {
      url: url,
      method: 'GET',
      headers: {
        'Authorization': token
      }
    }

    return fileHttpHelper(payload, resolve, reject)
  })
}

export const addFileTypePromise = (space, type, data, token) => {

  return new Promise((resolve, reject) => {

    const url = `${FILE_SERVICE_HOST}/file-admin/v1/${space}/types/${type}`
    const payload = {
      url: url,
      method: 'PUT',
      json: data,
      headers: {
        'Authorization': token
      }
    }
    return fileHttpHelper(payload, resolve, reject)
  })
}

export const createSpacePromise = (tenantId, realm, token) => {

  return new Promise((resolve, reject) => {

    const path = '/space/v1/spaces';

    const data = {
      name: realm,
      spaceAdminRole: `${realm}-file-admin`,
      id: tenantId
    }

    const url = `${FILE_SERVICE_HOST}${path}/${tenantId}`;
    const payload = {
      url: url,
      method: 'PUT',
      json: data,
      headers: {
        'Authorization': token
      }
    };
    fileHttpHelper(payload, resolve, reject)
  });
}