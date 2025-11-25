'use strict';

var fp = require('lodash/fp');
var index = require('../utils/index.js');
var schema$1 = require('./validation/schema.js');

var schema = (()=>{
    const internals = {
        isUpdating: false
    };
    return {
        async getSchema (ctx) {
            const schema = await index.getService('schema').getSchema();
            ctx.send({
                data: schema
            });
        },
        async updateSchema (ctx) {
            if (internals.isUpdating === true) {
                return ctx.conflict('Schema update is already in progress.');
            }
            try {
                const { data } = await schema$1.validateUpdateSchema(ctx.request.body);
                if (fp.isEmpty(data.components) && fp.isEmpty(data.contentTypes)) {
                    ctx.body = {};
                    return;
                }
                internals.isUpdating = true;
                strapi.reload.isWatching = false;
                await index.getService('schema').updateSchema(data);
                // NOTE: we do not set isUpdating to false here.
                // We want to wait for the server to restart to get the isUpdate = false only
                setImmediate(()=>{
                    strapi.reload();
                });
                ctx.body = {};
            } catch (error) {
                internals.isUpdating = false;
                const errorMessage = error instanceof Error ? error.message : String(error);
                return ctx.send({
                    error: errorMessage
                }, 400);
            }
        },
        async getUpdateSchemaStatus (ctx) {
            ctx.send({
                data: {
                    isUpdating: internals.isUpdating
                }
            });
        }
    };
});

module.exports = schema;
//# sourceMappingURL=schema.js.map
