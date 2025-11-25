'use strict';

var stream = require('stream');
var fp = require('lodash/fp');
var providers = require('../../../../../errors/providers.js');
require('crypto');
var json = require('../../../../../utils/json.js');
require('events');
var entity = require('../../../../queries/entity.js');
var components = require('../../../../../utils/components.js');

const createEntitiesWriteStream = (options)=>{
    const { strapi, updateMappingTable, transaction } = options;
    const query = entity.createEntityQuery(strapi);
    return new stream.Writable({
        objectMode: true,
        async write (entity, _encoding, callback) {
            await transaction?.attach(async ()=>{
                const { type, id, data } = entity;
                const { create, getDeepPopulateComponentLikeQuery } = query(type);
                const contentType = strapi.getModel(type);
                try {
                    const created = await create({
                        data,
                        populate: getDeepPopulateComponentLikeQuery(contentType, {
                            select: 'id'
                        }),
                        select: 'id'
                    });
                    // Compute differences between original & new entities
                    const diffs = json.diff(data, created);
                    updateMappingTable(type, id, created.id);
                    // For each difference found on an ID attribute,
                    // update the mapping the table accordingly
                    diffs.forEach((diff)=>{
                        if (diff.kind === 'modified' && fp.last(diff.path) === 'id' && 'kind' in contentType) {
                            const target = components.resolveComponentUID({
                                paths: diff.path,
                                data,
                                contentType,
                                strapi
                            });
                            // If no type is found for the given path, then ignore the diff
                            if (!target) {
                                return;
                            }
                            const [oldID, newID] = diff.values;
                            updateMappingTable(target, oldID, newID);
                        }
                    });
                } catch (e) {
                    if (e instanceof Error) {
                        return callback(e);
                    }
                    return callback(new providers.ProviderTransferError(`Failed to create "${type}" (${id})`));
                }
                return callback(null);
            });
        }
    });
};

exports.createEntitiesWriteStream = createEntitiesWriteStream;
//# sourceMappingURL=entities.js.map
