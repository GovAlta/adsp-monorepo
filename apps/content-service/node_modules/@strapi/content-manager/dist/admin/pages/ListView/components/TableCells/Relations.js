'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useDocument = require('../../../../hooks/useDocument.js');
var relations$1 = require('../../../../services/relations.js');
var relations = require('../../../../utils/relations.js');
var translations = require('../../../../utils/translations.js');

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

const RelationSingle = ({ mainField, content })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        maxWidth: "50rem",
        textColor: "neutral800",
        ellipsis: true,
        children: relations.getRelationLabel(content, mainField)
    });
};
/**
 * TODO: fix this component – tracking issue https://strapi-inc.atlassian.net/browse/CONTENT-2184
 */ const RelationMultiple = ({ mainField, content, rowId, name })=>{
    const { model } = useDocument.useDoc();
    const { formatMessage } = reactIntl.useIntl();
    const { notifyStatus } = designSystem.useNotifyAT();
    const [isOpen, setIsOpen] = React__namespace.useState(false);
    const [targetField] = name.split('.');
    const { data, isLoading } = relations$1.useGetRelationsQuery({
        model,
        id: rowId,
        targetField
    }, {
        skip: !isOpen,
        refetchOnMountOrArgChange: true
    });
    const contentCount = Array.isArray(content) ? content.length : content.count;
    React__namespace.useEffect(()=>{
        if (data) {
            notifyStatus(formatMessage({
                id: translations.getTranslation('DynamicTable.relation-loaded'),
                defaultMessage: 'Relations have been loaded'
            }));
        }
    }, [
        data,
        formatMessage,
        notifyStatus
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
        onOpenChange: (isOpen)=>setIsOpen(isOpen),
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Trigger, {
                onClick: (e)=>e.stopPropagation(),
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    style: {
                        cursor: 'pointer'
                    },
                    textColor: "neutral800",
                    fontWeight: "regular",
                    children: contentCount > 0 ? formatMessage({
                        id: 'content-manager.containers.list.items',
                        defaultMessage: '{number} {number, plural, =0 {items} one {item} other {items}}'
                    }, {
                        number: contentCount
                    }) : '-'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Content, {
                children: [
                    isLoading && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                        disabled: true,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                            small: true,
                            children: formatMessage({
                                id: translations.getTranslation('ListViewTable.relation-loading'),
                                defaultMessage: 'Relations are loading'
                            })
                        })
                    }),
                    data?.results && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                        children: [
                            data.results.map((entry)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        maxWidth: "50rem",
                                        ellipsis: true,
                                        children: relations.getRelationLabel(entry, mainField)
                                    })
                                }, entry.documentId)),
                            data?.pagination && data?.pagination.total > 10 && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                "aria-disabled": true,
                                "aria-label": formatMessage({
                                    id: translations.getTranslation('ListViewTable.relation-more'),
                                    defaultMessage: 'This relation contains more entities than displayed'
                                }),
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    children: "…"
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

exports.RelationMultiple = RelationMultiple;
exports.RelationSingle = RelationSingle;
//# sourceMappingURL=Relations.js.map
