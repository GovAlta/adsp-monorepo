import { Readable } from 'stream';
import { createLinkQuery } from '../../queries/link.mjs';

/**
 * Create a Readable which will stream all the links from a Strapi instance
 */ const createLinksStream = (strapi)=>{
    const uids = [
        ...Object.keys(strapi.contentTypes),
        ...Object.keys(strapi.components)
    ];
    // Async generator stream that returns every link from a Strapi instance
    return Readable.from(async function* linkGenerator() {
        const query = createLinkQuery(strapi);
        for (const uid of uids){
            const generator = query().generateAll(uid);
            for await (const link of generator){
                yield link;
            }
        }
    }());
};

export { createLinksStream };
//# sourceMappingURL=links.mjs.map
