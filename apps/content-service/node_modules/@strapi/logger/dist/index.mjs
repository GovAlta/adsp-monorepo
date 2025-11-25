import * as winston from 'winston';
export { winston };
import * as index from './configs/index.mjs';
export { index as configs };
import * as index$1 from './formats/index.mjs';
export { index$1 as formats };
import defaultConfiguration from './configs/default-configuration.mjs';

const createLogger = (userConfiguration = {})=>{
    const configuration = defaultConfiguration();
    Object.assign(configuration, userConfiguration);
    return winston.createLogger(configuration);
};

export { createLogger };
//# sourceMappingURL=index.mjs.map
