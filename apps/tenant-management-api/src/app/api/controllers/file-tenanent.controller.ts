import {
  JsonController,
  Post,
  Req,
  Res,
  UseBefore,
  Body,
} from 'routing-controllers';

import 'reflect-metadata';

import { WinstonLogger } from '../../../middleware/logger';
import * as passport from 'passport';
import { IsDefined } from 'class-validator';
import * as request from 'request';
class CreateSpaceRequest {
  @IsDefined()
  public realmId: string;

  @IsDefined()
  public tenantId: string;

  @IsDefined()
  public name: string
}

// TODO, need to update the API when the service configuration part is done
@JsonController('/v1/tenanat/file-service')
@UseBefore(passport.authenticate('jwt'))
@UseBefore(WinstonLogger)
export class FileTenantController {
  readonly host = process.env.FILE_SERVICE_HOST;
  readonly paths = {
    'space': '/space/v1/spaces'
  }

  @Post('/space')
  public async create(
    @Req() req: any,
    @Body({ required: true }) body: CreateSpaceRequest,
    @Res() response: any
  ) {
    const logger = req.logger;
    const spaceAdminRole = body.name + '-file-service-admin';

    const data = {
      name: body.name,
      spaceAdminRole: spaceAdminRole,
      id: body.tenantId
    };

    const createSpacePromise = (data, headers, logger) => {
      return new Promise((resolve, reject) => {
        const url = process.env.FILE_SERVICE_HOST + this.paths['space'] + '/' + data['id'];
        const _request = {
          url: url,
          method: 'PUT',
          json: data,
          headers: {
            'Authorization': headers['authorization']
          }
        };

        request(_request, (err, res) => {

          if (res.statusCode != 200) {
            reject(res)
          } else {
            resolve(res.body)
          }
        })
      });
    };

    const result = await createSpacePromise(data, req.headers, logger);

    return result;
  }
}
