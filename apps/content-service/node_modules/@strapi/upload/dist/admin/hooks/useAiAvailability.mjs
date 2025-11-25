import { useAIAvailability as useAIAvailability$1 } from '@strapi/admin/strapi-admin/ee';
import { useSettings } from './useSettings.mjs';

const useAIAvailability = ()=>{
    const isAiAvailable = useAIAvailability$1();
    const { status, data } = useSettings(isAiAvailable);
    if (!isAiAvailable) {
        return {
            status: 'success',
            isEnabled: false
        };
    }
    return {
        status,
        isEnabled: data?.aiMetadata
    };
};

export { useAIAvailability };
//# sourceMappingURL=useAiAvailability.mjs.map
