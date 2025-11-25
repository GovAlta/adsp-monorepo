import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useForm, InputRenderer } from '@strapi/admin/strapi-admin';
import { useCollator, Flex, Typography, Grid } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useDoc } from '../../../hooks/useDocument.mjs';
import { getTranslation } from '../../../utils/translations.mjs';

const EXCLUDED_SORT_ATTRIBUTE_TYPES = [
    'media',
    'richtext',
    'dynamiczone',
    'relation',
    'component',
    'json',
    'blocks'
];
const Settings = ()=>{
    const { formatMessage, locale } = useIntl();
    const formatter = useCollator(locale, {
        sensitivity: 'base'
    });
    const { schema } = useDoc();
    const layout = useForm('Settings', (state)=>state.values.layout ?? []);
    const currentSortBy = useForm('Settings', (state)=>state.values.settings.defaultSortBy);
    const onChange = useForm('Settings', (state)=>state.onChange);
    const sortOptions = React.useMemo(()=>Object.values(layout).reduce((acc, field)=>{
            if (schema && !EXCLUDED_SORT_ATTRIBUTE_TYPES.includes(schema.attributes[field.name].type)) {
                acc.push({
                    value: field.name,
                    label: typeof field.label !== 'string' ? formatMessage(field.label) : field.label
                });
            }
            return acc;
        }, []), [
        formatMessage,
        layout,
        schema
    ]);
    const sortOptionsSorted = sortOptions.sort((a, b)=>formatter.compare(a.label, b.label));
    React.useEffect(()=>{
        if (sortOptionsSorted.findIndex((opt)=>opt.value === currentSortBy) === -1) {
            onChange('settings.defaultSortBy', sortOptionsSorted[0]?.value);
        }
    }, [
        currentSortBy,
        onChange,
        sortOptionsSorted
    ]);
    const formLayout = React.useMemo(()=>SETTINGS_FORM_LAYOUT.map((row)=>row.map((field)=>{
                if (field.type === 'enumeration') {
                    return {
                        ...field,
                        hint: field.hint ? formatMessage(field.hint) : undefined,
                        label: formatMessage(field.label),
                        options: field.name === 'settings.defaultSortBy' ? sortOptionsSorted : field.options
                    };
                } else {
                    return {
                        ...field,
                        hint: field.hint ? formatMessage(field.hint) : undefined,
                        label: formatMessage(field.label)
                    };
                }
            })), [
        formatMessage,
        sortOptionsSorted
    ]);
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 4,
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "delta",
                tag: "h2",
                children: formatMessage({
                    id: getTranslation('containers.SettingPage.settings'),
                    defaultMessage: 'Settings'
                })
            }),
            /*#__PURE__*/ jsx(Grid.Root, {
                gap: 4,
                children: formLayout.map((row)=>row.map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                            s: 12,
                            col: size,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(InputRenderer, {
                                ...field
                            })
                        }, field.name)))
            }, "bottom")
        ]
    });
};
const SETTINGS_FORM_LAYOUT = [
    [
        {
            label: {
                id: getTranslation('form.Input.search'),
                defaultMessage: 'Enable search'
            },
            name: 'settings.searchable',
            size: 4,
            type: 'boolean'
        },
        {
            label: {
                id: getTranslation('form.Input.filters'),
                defaultMessage: 'Enable filters'
            },
            name: 'settings.filterable',
            size: 4,
            type: 'boolean'
        },
        {
            label: {
                id: getTranslation('form.Input.bulkActions'),
                defaultMessage: 'Enable bulk actions'
            },
            name: 'settings.bulkable',
            size: 4,
            type: 'boolean'
        }
    ],
    [
        {
            hint: {
                id: getTranslation('form.Input.pageEntries.inputDescription'),
                defaultMessage: 'Note: You can override this value in the Collection Type settings page.'
            },
            label: {
                id: getTranslation('form.Input.pageEntries'),
                defaultMessage: 'Entries per page'
            },
            name: 'settings.pageSize',
            options: [
                '10',
                '20',
                '50',
                '100'
            ].map((value)=>({
                    value,
                    label: value
                })),
            size: 6,
            type: 'enumeration'
        },
        {
            label: {
                id: getTranslation('form.Input.defaultSort'),
                defaultMessage: 'Default sort attribute'
            },
            name: 'settings.defaultSortBy',
            options: [],
            size: 3,
            type: 'enumeration'
        },
        {
            label: {
                id: getTranslation('form.Input.sort.order'),
                defaultMessage: 'Default sort order'
            },
            name: 'settings.defaultSortOrder',
            options: [
                'ASC',
                'DESC'
            ].map((value)=>({
                    value,
                    label: value
                })),
            size: 3,
            type: 'enumeration'
        }
    ]
];

export { Settings };
//# sourceMappingURL=Settings.mjs.map
