import { jsx } from 'react/jsx-runtime';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { sortOptions } from '../../constants.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../utils/urlYupSchema.mjs';

// TODO: find a better naming convention for the file that was an index file before
const SortPicker = ({ onChangeSort, value })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(SingleSelect, {
        size: "S",
        value: value,
        onChange: (value)=>onChangeSort(value.toString()),
        "aria-label": formatMessage({
            id: getTrad('sort.label'),
            defaultMessage: 'Sort by'
        }),
        placeholder: formatMessage({
            id: getTrad('sort.label'),
            defaultMessage: 'Sort by'
        }),
        children: sortOptions.map((filter)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                value: filter.value,
                children: formatMessage({
                    id: getTrad(filter.key),
                    defaultMessage: `${filter.value}`
                })
            }, filter.key))
    });
};

export { SortPicker };
//# sourceMappingURL=SortPicker.mjs.map
