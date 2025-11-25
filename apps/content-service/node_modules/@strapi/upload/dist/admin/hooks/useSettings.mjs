import { useFetchClient } from '@strapi/admin/strapi-admin';
import { useQuery } from 'react-query';

function useSettings(isEnabled = true) {
    const { get } = useFetchClient();
    return useQuery({
        queryKey: [
            'upload',
            'settings'
        ],
        enabled: isEnabled,
        async queryFn () {
            const { data: { data } } = await get('/upload/settings');
            return data;
        }
    });
}

export { useSettings };
//# sourceMappingURL=useSettings.mjs.map
