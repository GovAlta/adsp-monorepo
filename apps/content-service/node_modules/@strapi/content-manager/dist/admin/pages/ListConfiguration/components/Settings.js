'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useDocument = require('../../../hooks/useDocument.js');
var translations = require('../../../utils/translations.js');

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
    const { formatMessage, locale } = reactIntl.useIntl();
    const formatter = designSystem.useCollator(locale, {
        sensitivity: 'base'
    });
    const { schema } = useDocument.useDoc();
    const layout = strapiAdmin.useForm('Settings', (state)=>state.values.layout ?? []);
    const currentSortBy = strapiAdmin.useForm('Settings', (state)=>state.values.settings.defaultSortBy);
    const onChange = strapiAdmin.useForm('Settings', (state)=>state.onChange);
    const sortOptions = React__namespace.useMemo(()=>Object.values(layout).reduce((acc, field)=>{
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
    React__namespace.useEffect(()=>{
        if (sortOptionsSorted.findIndex((opt)=>opt.value === currentSortBy) === -1) {
            onChange('settings.defaultSortBy', sortOptionsSorted[0]?.value);
        }
    }, [
        currentSortBy,
        onChange,
        sortOptionsSorted
    ]);
    const formLayout = React__namespace.useMemo(()=>SETTINGS_FORM_LAYOUT.map((row)=>row.map((field)=>{
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 4,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "delta",
                tag: "h2",
                children: formatMessage({
                    id: translations.getTranslation('containers.SettingPage.settings'),
                    defaultMessage: 'Settings'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                gap: 4,
                children: formLayout.map((row)=>row.map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            s: 12,
                            col: size,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.InputRenderer, {
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
                id: translations.getTranslation('form.Input.search'),
                defaultMessage: 'Enable search'
            },
            name: 'settings.searchable',
            size: 4,
            type: 'boolean'
        },
        {
            label: {
                id: translations.getTranslation('form.Input.filters'),
                defaultMessage: 'Enable filters'
            },
            name: 'settings.filterable',
            size: 4,
            type: 'boolean'
        },
        {
            label: {
                id: translations.getTranslation('form.Input.bulkActions'),
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
                id: translations.getTranslation('form.Input.pageEntries.inputDescription'),
                defaultMessage: 'Note: You can override this value in the Collection Type settings page.'
            },
            label: {
                id: translations.getTranslation('form.Input.pageEntries'),
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
                id: translations.getTranslation('form.Input.defaultSort'),
                defaultMessage: 'Default sort attribute'
            },
            name: 'settings.defaultSortBy',
            options: [],
            size: 3,
            type: 'enumeration'
        },
        {
            label: {
                id: translations.getTranslation('form.Input.sort.order'),
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

exports.Settings = Settings;
//# sourceMappingURL=Settings.js.map
