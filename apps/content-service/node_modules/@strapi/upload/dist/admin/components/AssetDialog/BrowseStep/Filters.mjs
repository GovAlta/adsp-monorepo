import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Popover, Button } from '@strapi/design-system';
import { Filter } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { displayedFilters } from '../../../utils/displayedFilters.mjs';
import 'byte-size';
import 'date-fns';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';
import { FilterList } from '../../FilterList/FilterList.mjs';
import { FilterPopover } from '../../FilterPopover/FilterPopover.mjs';

const Filters = ({ appliedFilters, onChangeFilters })=>{
    const [open, setOpen] = React.useState(false);
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Popover.Root, {
        open: open,
        onOpenChange: setOpen,
        children: [
            /*#__PURE__*/ jsx(Popover.Trigger, {
                children: /*#__PURE__*/ jsx(Button, {
                    variant: "tertiary",
                    startIcon: /*#__PURE__*/ jsx(Filter, {}),
                    size: "S",
                    children: formatMessage({
                        id: 'app.utils.filters',
                        defaultMessage: 'Filters'
                    })
                })
            }),
            /*#__PURE__*/ jsx(FilterPopover, {
                onToggle: ()=>setOpen((prev)=>!prev),
                displayedFilters: displayedFilters,
                filters: appliedFilters,
                onSubmit: onChangeFilters
            }),
            appliedFilters && /*#__PURE__*/ jsx(FilterList, {
                appliedFilters: appliedFilters,
                filtersSchema: displayedFilters,
                onRemoveFilter: onChangeFilters
            })
        ]
    });
};

export { Filters };
//# sourceMappingURL=Filters.mjs.map
