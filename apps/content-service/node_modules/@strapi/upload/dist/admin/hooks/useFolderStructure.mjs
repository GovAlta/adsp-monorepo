import { useFetchClient } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import { useQuery } from 'react-query';
import { pluginId } from '../pluginId.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../utils/getTrad.mjs';
import 'qs';
import '../constants.mjs';
import '../utils/urlYupSchema.mjs';
import { recursiveRenameKeys } from './utils/renameKeys.mjs';

const FIELD_MAPPING = {
    name: 'label',
    id: 'value'
};
const useFolderStructure = ({ enabled = true } = {})=>{
    const { formatMessage } = useIntl();
    const { get } = useFetchClient();
    const fetchFolderStructure = async ()=>{
        const { data: { data } } = await get('/upload/folder-structure');
        const children = data.map((f)=>recursiveRenameKeys(f, (key)=>FIELD_MAPPING?.[key] ?? key));
        return [
            {
                value: null,
                label: formatMessage({
                    id: getTrad('form.input.label.folder-location-default-label'),
                    defaultMessage: 'Media Library'
                }),
                children
            }
        ];
    };
    const { data, error, isLoading } = useQuery([
        pluginId,
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

export { useFolderStructure };
//# sourceMappingURL=useFolderStructure.mjs.map
