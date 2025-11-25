import { transports } from 'winston';
import { LEVEL_LABEL, LEVELS } from '../constants.mjs';
import prettyPrint from '../formats/pretty-print.mjs';
import '../formats/exclude-colors.mjs';
import '../formats/detailed-log.mjs';

var defaultConfiguration = (()=>{
    return {
        level: LEVEL_LABEL,
        levels: LEVELS,
        format: prettyPrint(),
        transports: [
            new transports.Console()
        ]
    };
});

export { defaultConfiguration as default };
//# sourceMappingURL=default-configuration.mjs.map
