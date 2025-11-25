import { map, pick } from 'lodash/fp';

// visible fields for the API
const publicFields = [
    'id',
    'displayName',
    'category'
];
const formatConditions = map(pick(publicFields));

export { formatConditions };
//# sourceMappingURL=conditions.mjs.map
