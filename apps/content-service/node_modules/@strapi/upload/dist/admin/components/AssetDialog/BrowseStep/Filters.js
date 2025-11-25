'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var displayedFilters = require('../../../utils/displayedFilters.js');
require('byte-size');
require('date-fns');
require('qs');
require('../../../constants.js');
require('../../../utils/urlYupSchema.js');
var FilterList = require('../../FilterList/FilterList.js');
var FilterPopover = require('../../FilterPopover/FilterPopover.js');

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

const Filters = ({ appliedFilters, onChangeFilters })=>{
    const [open, setOpen] = React__namespace.useState(false);
    const { formatMessage } = reactIntl.useIntl();
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
                onToggle: ()=>setOpen((prev)=>!prev),
                displayedFilters: displayedFilters.displayedFilters,
                filters: appliedFilters,
                onSubmit: onChangeFilters
            }),
            appliedFilters && /*#__PURE__*/ jsxRuntime.jsx(FilterList.FilterList, {
                appliedFilters: appliedFilters,
                filtersSchema: displayedFilters.displayedFilters,
                onRemoveFilter: onChangeFilters
            })
        ]
    });
};

exports.Filters = Filters;
//# sourceMappingURL=Filters.js.map
