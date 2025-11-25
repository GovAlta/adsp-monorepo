'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');

const { getRelationalFields } = strapiUtils.relations;
var metrics = (({ strapi })=>{
    const sendDidConfigureListView = async (contentType, configuration)=>{
        const displayedFields = fp.prop('length', configuration.layouts.list);
        const relationalFields = getRelationalFields(contentType);
        const displayedRelationalFields = fp.intersection(relationalFields, configuration.layouts.list).length;
        const data = {
            eventProperties: {
                containsRelationalFields: !!displayedRelationalFields
            }
        };
        if (data.eventProperties.containsRelationalFields) {
            Object.assign(data.eventProperties, {
                displayedFields,
                displayedRelationalFields
            });
        }
        try {
            await strapi.telemetry.send('didConfigureListView', data);
        } catch (e) {
        // silence
        }
    };
    return {
        sendDidConfigureListView
    };
});

module.exports = metrics;
//# sourceMappingURL=metrics.js.map
