import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    PLATFORM_TENANT_REALM: envalid.str({ default: '0014430f-abb9-4b57-915c-de9f3c889696' }),
    SERVICE_STATUS_API_URL: envalid.str({ default: 'http://localhost:3338' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
