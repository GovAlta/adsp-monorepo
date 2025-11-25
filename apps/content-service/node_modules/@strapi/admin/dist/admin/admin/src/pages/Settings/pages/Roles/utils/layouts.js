'use strict';

var groupBy = require('lodash/groupBy');

const formatLayout = (layout, groupByKey)=>{
    return Object.entries(groupBy(layout, groupByKey)).map(([itemName, item])=>({
            category: itemName,
            categoryId: itemName.split(' ').join('-'),
            childrenForm: Object.entries(groupBy(item, 'subCategory')).map(([subCategoryName, actions])=>({
                    subCategoryName,
                    subCategoryId: subCategoryName.split(' ').join('-'),
                    actions
                }))
        }));
};

exports.formatLayout = formatLayout;
//# sourceMappingURL=layouts.js.map
