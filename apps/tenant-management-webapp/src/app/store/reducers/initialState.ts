/**
 * isActive - whether the file service is ready
 * isDisabled - whether the server is enabled by user or admin
 */
import { CONFIG_INIT, Config } from './config.contract';
import { FILE_INIT, FileService } from './file.contract';
import { USER_INIT, User } from './user.contract';

export interface AppState {
  tenant: { file: FileService };
  user: User;
  config: Config;
}

// TODO: need to move then to Configuration Service later
const INIT_STATE: AppState = {
  tenant: {
    file: FILE_INIT,
  },
  user: USER_INIT,
  config: CONFIG_INIT,
};

export default INIT_STATE;
