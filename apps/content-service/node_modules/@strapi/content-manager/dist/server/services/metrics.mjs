import { prop, intersection } from 'lodash/fp';
import { relations } from '@strapi/utils';

const { getRelationalFields } = relations;
var metrics = (({ strapi })=>{
    const sendDidConfigureListView = async (contentType, configuration)=>{
        const displayedFields = prop('length', configuration.layouts.list);
        const relationalFields = getRelationalFields(contentType);
        const displayedRelationalFields = intersection(relationalFields, configuration.layouts.list).length;
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

export { metrics as default };
//# sourceMappingURL=metrics.mjs.map
