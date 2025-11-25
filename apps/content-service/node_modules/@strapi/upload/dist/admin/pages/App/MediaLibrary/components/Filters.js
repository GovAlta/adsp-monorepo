'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var FilterList = require('../../../../components/FilterList/FilterList.js');
var FilterPopover = require('../../../../components/FilterPopover/FilterPopover.js');
var displayedFilters = require('../../../../utils/displayedFilters.js');
require('byte-size');
require('date-fns');
require('qs');
require('../../../../constants.js');
require('../../../../utils/urlYupSchema.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const Filters = ()=>{
    const [open, setOpen] = React__namespace.useState(false);
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const [{ query }, setQuery] = strapiAdmin.useQueryParams();
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
        open: open,
        onOpenChange: setOpen,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "tertiary",
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Filter, {}),
                    size: "S",
                    children: formatMessage({
                        id: 'app.utils.filters',
                        defaultMessage: 'Filters'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(FilterPopover.FilterPopover, {
                displayedFilters: displayedFilters.displayedFilters,
                filters: filters,
                onSubmit: handleSubmit,
                onToggle: setOpen
            }),
            /*#__PURE__*/ jsxRuntime.jsx(FilterList.FilterList, {
                appliedFilters: filters,
                filtersSchema: displayedFilters.displayedFilters,
                onRemoveFilter: handleRemoveFilter
            })
        ]
    });
};

exports.Filters = Filters;
//# sourceMappingURL=Filters.js.map
