import { jsx } from 'react/jsx-runtime';
import { FilterTag } from './FilterTag.mjs';

// TODO: find a better naming convention for the file that was an index file before
const FilterList = ({ appliedFilters, filtersSchema, onRemoveFilter })=>{
    const handleClick = (filter)=>{
        const nextFilters = appliedFilters.filter((prevFilter)=>{
            const name = Object.keys(filter)[0];
            const filterName = filter[name];
            if (filterName !== undefined) {
                const filterType = Object.keys(filterName)[0];
                const filterValue = filterName[filterType];
                if (typeof filterValue === 'string') {
                    const decodedValue = decodeURIComponent(filterValue);
                    return prevFilter[name]?.[filterType] !== decodedValue;
                }
            }
            return true;
        });
        onRemoveFilter(nextFilters);
    };
    return appliedFilters.map((filter, i)=>{
        const attributeName = Object.keys(filter)[0];
        const attribute = filtersSchema.find(({ name })=>name === attributeName);
        if (!attribute) {
            // Handle the case where attribute is undefined
            return null;
        }
        const filterObj = filter[attributeName];
        const operator = Object.keys(filterObj)[0];
        let value = filterObj[operator];
        if (Array.isArray(value)) {
            value = value.join(', ');
        } else if (typeof value === 'object') {
            value = Object.values(value).join(', ');
        } else {
            value = Array.isArray(value) || typeof value === 'object' ? Object.values(value).join(', ') : decodeURIComponent(value);
        }
        let displayedOperator = operator;
        if (attribute?.name === 'mime') {
            displayedOperator = operator === '$contains' ? '$eq' : '$ne';
            // Type is file
            // The filter for the file is the following: { mime: {$not: {$contains: ['image', 'video']}}}
            if (operator === '$not') {
                value = 'file';
                displayedOperator = '$eq';
            }
            // Here the type is file and the filter is not file
            // { mime: {$contains: ['image', 'video'] }}
            if ([
                'image',
                'video'
            ].includes(value[0]) && [
                'image',
                'video'
            ].includes(value[1])) {
                value = 'file';
                displayedOperator = '$ne';
            }
        }
        return /*#__PURE__*/ jsx(FilterTag, {
            attribute: attribute,
            filter: filter,
            onClick: handleClick,
            operator: displayedOperator,
            value: value
        }, `${attributeName}-${i}`);
    });
};

export { FilterList };
//# sourceMappingURL=FilterList.mjs.map
