'use strict';

var debug$1 = require('../../../../utils/debug.js');
require('node:crypto');
require('zod/v4');

const debug = debug$1.createDebugger('assembler:path-item');
class PathItemAssembler {
    assemble(context) {
        const { output, routes } = context;
        const routesByPath = this._groupRoutesByPath(routes);
        debug('grouping routes by path, found %O groups for %O routes', Object.keys(routesByPath).length, routes.length);
        for (const [path, routes] of Object.entries(routesByPath)){
            const openAPIPath = this._formatPath(path);
            debug('assembling path item for %o (%o)...', openAPIPath, routes.map((route)=>route.method).join(', '));
            const pathItemContext = this._createPathItemContext(context);
            for (const assembler of this._assemblers){
                debug('running assembler: %s...', assembler.constructor.name);
                assembler.assemble(pathItemContext, path, routes);
            }
            output.data[openAPIPath] = pathItemContext.output.data;
        }
    }
    _createPathItemContext(context) {
        const initProps = {
            strapi: context.strapi,
            registries: context.registries,
            routes: context.routes,
            timer: context.timer
        };
        return this._contextFactory.create(initProps);
    }
    _formatPath(path) {
        return path.replace(/:([^/]+)/g, '{$1}');
    }
    _groupRoutesByPath(routes) {
        return routes.reduce((acc, route)=>{
            const { path } = route;
            if (!Array.isArray(acc[path])) {
                acc[path] = [];
            }
            acc[path].push(route);
            return acc;
        }, {});
    }
    constructor(assemblers, contextFactory){
        this._assemblers = assemblers;
        this._contextFactory = contextFactory;
    }
}

exports.PathItemAssembler = PathItemAssembler;
//# sourceMappingURL=path-item.js.map
