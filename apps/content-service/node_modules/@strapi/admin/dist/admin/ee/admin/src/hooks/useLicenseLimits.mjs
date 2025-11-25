import * as React from 'react';
import { useGetLicenseLimitsQuery } from '../../../../admin/src/services/admin.mjs';

function useLicenseLimits({ enabled } = {
    enabled: true
}) {
    const { data, isError, isLoading } = useGetLicenseLimitsQuery(undefined, {
        skip: !enabled
    });
    const getFeature = React.useCallback((name)=>{
        const feature = data?.data?.features.find((feature)=>feature.name === name);
        if (feature && 'options' in feature) {
            return feature.options;
        } else {
            return {};
        }
    }, [
        data
    ]);
    return {
        license: data?.data,
        getFeature,
        isError,
        isLoading,
        isTrial: data?.data?.isTrial ?? false
    };
}

export { useLicenseLimits };
//# sourceMappingURL=useLicenseLimits.mjs.map
