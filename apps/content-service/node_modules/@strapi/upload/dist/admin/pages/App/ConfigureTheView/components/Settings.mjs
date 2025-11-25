import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Grid, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { pageSizes, sortOptions } from '../../../../constants.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../../utils/getTrad.mjs';
import 'qs';
import '../../../../utils/urlYupSchema.mjs';

const Settings = ({ sort = '', pageSize = 10, onChange })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "tableShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsxs(Grid.Root, {
            gap: 4,
            children: [
                /*#__PURE__*/ jsx(Grid.Item, {
                    s: 12,
                    col: 6,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxs(Field.Root, {
                        hint: formatMessage({
                            id: getTrad('config.entries.note'),
                            defaultMessage: 'Number of assets displayed by default in the Media Library'
                        }),
                        name: "pageSize",
                        children: [
                            /*#__PURE__*/ jsx(Field.Label, {
                                children: formatMessage({
                                    id: getTrad('config.entries.title'),
                                    defaultMessage: 'Entries per page'
                                })
                            }),
                            /*#__PURE__*/ jsx(SingleSelect, {
                                onChange: (value)=>onChange({
                                        target: {
                                            name: 'pageSize',
                                            value
                                        }
                                    }),
                                value: pageSize,
                                children: pageSizes.map((pageSize)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                        value: pageSize,
                                        children: pageSize
                                    }, pageSize))
                            }),
                            /*#__PURE__*/ jsx(Field.Hint, {})
                        ]
                    })
                }),
                /*#__PURE__*/ jsx(Grid.Item, {
                    s: 12,
                    col: 6,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxs(Field.Root, {
                        hint: formatMessage({
                            id: getTrad('config.note'),
                            defaultMessage: 'Note: You can override this value in the media library.'
                        }),
                        name: "sort",
                        children: [
                            /*#__PURE__*/ jsx(Field.Label, {
                                children: formatMessage({
                                    id: getTrad('config.sort.title'),
                                    defaultMessage: 'Default sort order'
                                })
                            }),
                            /*#__PURE__*/ jsx(SingleSelect, {
                                onChange: (value)=>onChange({
                                        target: {
                                            name: 'sort',
                                            value
                                        }
                                    }),
                                value: sort,
                                "test-sort": sort,
                                "data-testid": "sort-select",
                                children: sortOptions.map((filter)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                        "data-testid": `sort-option-${filter.value}`,
                                        value: filter.value,
                                        children: formatMessage({
                                            id: getTrad(filter.key),
                                            defaultMessage: `${filter.value}`
                                        })
                                    }, filter.key))
                            }),
                            /*#__PURE__*/ jsx(Field.Hint, {})
                        ]
                    })
                })
            ]
        })
    });
};

export { Settings };
//# sourceMappingURL=Settings.mjs.map
