import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Typography, useNotifyAT, Menu, Loader } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useDoc } from '../../../../hooks/useDocument.mjs';
import { useGetRelationsQuery } from '../../../../services/relations.mjs';
import { getRelationLabel } from '../../../../utils/relations.mjs';
import { getTranslation } from '../../../../utils/translations.mjs';

const RelationSingle = ({ mainField, content })=>{
    return /*#__PURE__*/ jsx(Typography, {
        maxWidth: "50rem",
        textColor: "neutral800",
        ellipsis: true,
        children: getRelationLabel(content, mainField)
    });
};
/**
 * TODO: fix this component – tracking issue https://strapi-inc.atlassian.net/browse/CONTENT-2184
 */ const RelationMultiple = ({ mainField, content, rowId, name })=>{
    const { model } = useDoc();
    const { formatMessage } = useIntl();
    const { notifyStatus } = useNotifyAT();
    const [isOpen, setIsOpen] = React.useState(false);
    const [targetField] = name.split('.');
    const { data, isLoading } = useGetRelationsQuery({
        model,
        id: rowId,
        targetField
    }, {
        skip: !isOpen,
        refetchOnMountOrArgChange: true
    });
    const contentCount = Array.isArray(content) ? content.length : content.count;
    React.useEffect(()=>{
        if (data) {
            notifyStatus(formatMessage({
                id: getTranslation('DynamicTable.relation-loaded'),
                defaultMessage: 'Relations have been loaded'
            }));
        }
    }, [
        data,
        formatMessage,
        notifyStatus
    ]);
    return /*#__PURE__*/ jsxs(Menu.Root, {
        onOpenChange: (isOpen)=>setIsOpen(isOpen),
        children: [
            /*#__PURE__*/ jsx(Menu.Trigger, {
                onClick: (e)=>e.stopPropagation(),
                children: /*#__PURE__*/ jsx(Typography, {
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
            /*#__PURE__*/ jsxs(Menu.Content, {
                children: [
                    isLoading && /*#__PURE__*/ jsx(Menu.Item, {
                        disabled: true,
                        children: /*#__PURE__*/ jsx(Loader, {
                            small: true,
                            children: formatMessage({
                                id: getTranslation('ListViewTable.relation-loading'),
                                defaultMessage: 'Relations are loading'
                            })
                        })
                    }),
                    data?.results && /*#__PURE__*/ jsxs(Fragment, {
                        children: [
                            data.results.map((entry)=>/*#__PURE__*/ jsx(Menu.Item, {
                                    children: /*#__PURE__*/ jsx(Typography, {
                                        maxWidth: "50rem",
                                        ellipsis: true,
                                        children: getRelationLabel(entry, mainField)
                                    })
                                }, entry.documentId)),
                            data?.pagination && data?.pagination.total > 10 && /*#__PURE__*/ jsx(Menu.Item, {
                                "aria-disabled": true,
                                "aria-label": formatMessage({
                                    id: getTranslation('ListViewTable.relation-more'),
                                    defaultMessage: 'This relation contains more entities than displayed'
                                }),
                                children: /*#__PURE__*/ jsx(Typography, {
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

export { RelationMultiple, RelationSingle };
//# sourceMappingURL=Relations.mjs.map
