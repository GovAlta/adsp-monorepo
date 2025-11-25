import { stringify } from 'qs';

const getFolderURL = (pathname, currentQuery, { folder, folderPath } = {})=>{
    const { _q, ...queryParamsWithoutQ } = currentQuery;
    const queryParamsString = stringify({
        ...queryParamsWithoutQ,
        folder,
        folderPath
    }, {
        encode: false
    });
    // Search query will always fetch the same results
    // we remove it here to allow navigating in a folder and see the result of this navigation
    return `${pathname}${queryParamsString ? `?${queryParamsString}` : ''}`;
};

export { getFolderURL };
//# sourceMappingURL=getFolderURL.mjs.map
