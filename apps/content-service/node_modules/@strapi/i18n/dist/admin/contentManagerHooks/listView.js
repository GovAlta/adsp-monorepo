'use strict';

var jsxRuntime = require('react/jsx-runtime');
var LocaleListCell = require('../components/LocaleListCell.js');
var fields = require('../utils/fields.js');
var getTranslation = require('../utils/getTranslation.js');

const addColumnToTableHook = ({ displayedHeaders, layout })=>{
    const { options } = layout;
    const isFieldLocalized = fields.doesPluginOptionsHaveI18nLocalized(options) ? options.i18n.localized : false;
    if (!isFieldLocalized) {
        return {
            displayedHeaders,
            layout
        };
    }
    return {
        displayedHeaders: [
            ...displayedHeaders,
            {
                attribute: {
                    type: 'string'
                },
                label: {
                    id: getTranslation.getTranslation('list-view.table.header.label'),
                    defaultMessage: 'Available in'
                },
                searchable: false,
                sortable: false,
                name: 'locales',
                // @ts-expect-error – ID is seen as number | string; this will change when we move the type over.
                cellFormatter: (props, _header, meta)=>/*#__PURE__*/ jsxRuntime.jsx(LocaleListCell.LocaleListCell, {
                        ...props,
                        ...meta
                    })
            }
        ],
        layout
    };
};

exports.addColumnToTableHook = addColumnToTableHook;
//# sourceMappingURL=listView.js.map
