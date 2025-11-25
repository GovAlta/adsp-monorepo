'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var pluginId = require('../pluginId.js');
require('byte-size');
require('date-fns');
var getTrad = require('../utils/getTrad.js');
require('qs');
require('../constants.js');
require('../utils/urlYupSchema.js');
var renameKeys = require('./utils/renameKeys.js');

const FIELD_MAPPING = {
    name: 'label',
    id: 'value'
};
const useFolderStructure = ({ enabled = true } = {})=>{
    const { formatMessage } = reactIntl.useIntl();
    const { get } = strapiAdmin.useFetchClient();
    const fetchFolderStructure = async ()=>{
        const { data: { data } } = await get('/upload/folder-structure');
        const children = data.map((f)=>renameKeys.recursiveRenameKeys(f, (key)=>FIELD_MAPPING?.[key] ?? key));
        return [
            {
                value: null,
                label: formatMessage({
                    id: getTrad.getTrad('form.input.label.folder-location-default-label'),
                    defaultMessage: 'Media Library'
                }),
                children
            }
        ];
    };
    const { data, error, isLoading } = reactQuery.useQuery([
        pluginId.pluginId,
        'folder',
        'structure'
    ], fetchFolderStructure, {
        enabled,
        staleTime: 0,
        cacheTime: 0
    });
    return {
        data,
        error,
        isLoading
    };
};

exports.useFolderStructure = useFolderStructure;
//# sourceMappingURL=useFolderStructure.js.map
