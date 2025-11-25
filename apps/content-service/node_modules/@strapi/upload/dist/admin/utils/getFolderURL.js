'use strict';

var qs = require('qs');

const getFolderURL = (pathname, currentQuery, { folder, folderPath } = {})=>{
    const { _q, ...queryParamsWithoutQ } = currentQuery;
    const queryParamsString = qs.stringify({
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

exports.getFolderURL = getFolderURL;
//# sourceMappingURL=getFolderURL.js.map
