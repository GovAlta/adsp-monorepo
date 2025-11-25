'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var constants = require('../../../../constants.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../../../utils/getTrad.js');
require('qs');
require('../../../../utils/urlYupSchema.js');

const Settings = ({ sort = '', pageSize = 10, onChange })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "tableShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
            gap: 4,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    s: 12,
                    col: 6,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                        hint: formatMessage({
                            id: getTrad.getTrad('config.entries.note'),
                            defaultMessage: 'Number of assets displayed by default in the Media Library'
                        }),
                        name: "pageSize",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                children: formatMessage({
                                    id: getTrad.getTrad('config.entries.title'),
                                    defaultMessage: 'Entries per page'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                                onChange: (value)=>onChange({
                                        target: {
                                            name: 'pageSize',
                                            value
                                        }
                                    }),
                                value: pageSize,
                                children: constants.pageSizes.map((pageSize)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                        value: pageSize,
                                        children: pageSize
                                    }, pageSize))
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    s: 12,
                    col: 6,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                        hint: formatMessage({
                            id: getTrad.getTrad('config.note'),
                            defaultMessage: 'Note: You can override this value in the media library.'
                        }),
                        name: "sort",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                children: formatMessage({
                                    id: getTrad.getTrad('config.sort.title'),
                                    defaultMessage: 'Default sort order'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                                onChange: (value)=>onChange({
                                        target: {
                                            name: 'sort',
                                            value
                                        }
                                    }),
                                value: sort,
                                "test-sort": sort,
                                "data-testid": "sort-select",
                                children: constants.sortOptions.map((filter)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                        "data-testid": `sort-option-${filter.value}`,
                                        value: filter.value,
                                        children: formatMessage({
                                            id: getTrad.getTrad(filter.key),
                                            defaultMessage: `${filter.value}`
                                        })
                                    }, filter.key))
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
                        ]
                    })
                })
            ]
        })
    });
};

exports.Settings = Settings;
//# sourceMappingURL=Settings.js.map
