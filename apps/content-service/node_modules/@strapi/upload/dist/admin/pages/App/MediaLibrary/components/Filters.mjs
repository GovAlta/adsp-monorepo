import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking, useQueryParams } from '@strapi/admin/strapi-admin';
import { Popover, Button } from '@strapi/design-system';
import { Filter } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { FilterList } from '../../../../components/FilterList/FilterList.mjs';
import { FilterPopover } from '../../../../components/FilterPopover/FilterPopover.mjs';
import { displayedFilters } from '../../../../utils/displayedFilters.mjs';
import 'byte-size';
import 'date-fns';
import 'qs';
import '../../../../constants.mjs';
import '../../../../utils/urlYupSchema.mjs';

const Filters = ()=>{
    const [open, setOpen] = React.useState(false);
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const [{ query }, setQuery] = useQueryParams();
    const filters = query?.filters?.$and || [];
    const handleRemoveFilter = (nextFilters)=>{
        setQuery({
            filters: {
                $and: nextFilters
            },
            page: 1
        });
    };
    const handleSubmit = (filters)=>{
        trackUsage('didFilterMediaLibraryElements', {
            location: 'content-manager',
            filter: Object.keys(filters[filters.length - 1])[0]
        });
        setQuery({
            filters: {
                $and: filters
            },
            page: 1
        });
    };
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
                displayedFilters: displayedFilters,
                filters: filters,
                onSubmit: handleSubmit,
                onToggle: setOpen
            }),
            /*#__PURE__*/ jsx(FilterList, {
                appliedFilters: filters,
                filtersSchema: displayedFilters,
                onRemoveFilter: handleRemoveFilter
            })
        ]
    });
};

export { Filters };
//# sourceMappingURL=Filters.mjs.map
