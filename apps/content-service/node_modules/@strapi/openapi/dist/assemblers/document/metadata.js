'use strict';

var debug$1 = require('../../utils/debug.js');
require('node:crypto');
require('zod/v4');

const debug = debug$1.createDebugger('assembler:metadata');
class DocumentMetadataAssembler {
    assemble(context) {
        const { strapi } = context;
        const strapiVersion = strapi.config.get('info.strapi');
        debug(`assembling document's metadata for %O...`, {
            strapiVersion
        });
        const metadata = new Map().set('openapi', '3.1.0').set('x-powered-by', 'strapi').set('x-strapi-version', strapiVersion);
        const metadataObject = Object.fromEntries(metadata);
        debug(`document's metadata assembled: %O`, metadataObject);
        Object.assign(context.output.data, metadataObject);
    }
}

exports.DocumentMetadataAssembler = DocumentMetadataAssembler;
//# sourceMappingURL=metadata.js.map
