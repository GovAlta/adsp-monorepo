'use strict';

var stream = require('stream');
var link = require('../../queries/link.js');

/**
 * Create a Readable which will stream all the links from a Strapi instance
 */ const createLinksStream = (strapi)=>{
    const uids = [
        ...Object.keys(strapi.contentTypes),
        ...Object.keys(strapi.components)
    ];
    // Async generator stream that returns every link from a Strapi instance
    return stream.Readable.from(async function* linkGenerator() {
        const query = link.createLinkQuery(strapi);
        for (const uid of uids){
            const generator = query().generateAll(uid);
            for await (const link of generator){
                yield link;
            }
        }
    }());
};

exports.createLinksStream = createLinksStream;
//# sourceMappingURL=links.js.map
