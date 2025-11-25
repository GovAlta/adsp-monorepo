'use strict';

var constants = require('../../../../../constants.js');
var debug$1 = require('../../../../../utils/debug.js');
require('node:crypto');
require('zod/v4');

const debug = debug$1.createDebugger('assembler:operation-id');
class OperationIDAssembler {
    assemble(context, route) {
        const { path, method, info } = route;
        const origin = info.apiName ?? info.pluginName;
        const [operationId] = [
            ''
        ]// 'origin/' or ''
        .map(this._maybeAppendOrigin(origin))// 'origin/get' or 'get'
        .map(this._appendMethod(method))// 'origin/get/entity_by_id' or 'get/entity_by_id'
        .map(this._maybeAppendPath(path));
        debug('assembled an operation ID for %o %o: %o', method, path, operationId);
        context.output.data.operationId = operationId;
    }
    _maybeAppendOrigin(origin) {
        return ()=>origin ? `${origin}/` : '';
    }
    _appendMethod(method) {
        return (operationId)=>`${operationId}${method.toLowerCase()}`;
    }
    _maybeAppendPath(path) {
        const pathParts = path.split('/').filter(Boolean);
        return (operationId)=>{
            if (!pathParts.length) {
                return operationId;
            }
            // Make sure to add a trailing slash after the method name
            let appendix = '/';
            const formatPart = (str)=>/[_/]$/.test(appendix) ? str : `_${str}`;
            pathParts.forEach((part)=>{
                const match = constants.REGEX_STRAPI_PATH_PARAMS.exec(part);
                appendix += match ? formatPart(`by_${match[1]}`) : formatPart(part.replaceAll(/\W/g, '_'));
            });
            return `${operationId}${appendix}`;
        };
    }
}

exports.OperationIDAssembler = OperationIDAssembler;
//# sourceMappingURL=operation-id.js.map
