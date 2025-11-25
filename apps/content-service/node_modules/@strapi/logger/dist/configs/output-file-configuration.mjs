import { transports } from 'winston';
import { LEVEL_LABEL, LEVELS } from '../constants.mjs';
import prettyPrint from '../formats/pretty-print.mjs';
import excludeColors from '../formats/exclude-colors.mjs';
import '../formats/detailed-log.mjs';

var outputFileConfiguration = ((filename, fileTransportOptions = {})=>{
    return {
        level: LEVEL_LABEL,
        levels: LEVELS,
        format: prettyPrint(),
        transports: [
            new transports.Console(),
            new transports.File({
                level: 'error',
                filename,
                format: excludeColors,
                ...fileTransportOptions
            })
        ]
    };
});

export { outputFileConfiguration as default };
//# sourceMappingURL=output-file-configuration.mjs.map
