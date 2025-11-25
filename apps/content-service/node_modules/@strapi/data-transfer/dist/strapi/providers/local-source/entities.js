'use strict';

var stream = require('stream');
var entity = require('../../queries/entity.js');
require('lodash/fp');

/**
 * Generate and consume content-types streams in order to stream each entity individually
 */ const createEntitiesStream = (strapi)=>{
    const contentTypes = Object.values(strapi.contentTypes);
    async function* contentTypeStreamGenerator() {
        for (const contentType of contentTypes){
            const query = entity.createEntityQuery(strapi).call(null, contentType.uid);
            const stream = strapi.db// Create a query builder instance (default type is 'select')
            .queryBuilder(contentType.uid)// Fetch all columns
            .select('*')// Apply the populate
            .populate(query.deepPopulateComponentLikeQuery)// Get a readable stream
            .stream();
            yield {
                contentType,
                stream
            };
        }
    }
    return stream.Readable.from(async function* entitiesGenerator() {
        for await (const { stream, contentType } of contentTypeStreamGenerator()){
            try {
                for await (const entity of stream){
                    yield {
                        entity,
                        contentType
                    };
                }
            } catch  {
            // ignore
            } finally{
                stream.destroy();
            }
        }
    }());
};
/**
 * Create an entity transform stream which convert the output of
 * the multi-content-types stream to the transfer entity format
 */ const createEntitiesTransformStream = ()=>{
    return new stream.Transform({
        objectMode: true,
        transform (data, _encoding, callback) {
            const { entity, contentType } = data;
            const { id, ...attributes } = entity;
            callback(null, {
                type: contentType.uid,
                id,
                data: attributes
            });
        }
    });
};

exports.createEntitiesStream = createEntitiesStream;
exports.createEntitiesTransformStream = createEntitiesTransformStream;
//# sourceMappingURL=entities.js.map
