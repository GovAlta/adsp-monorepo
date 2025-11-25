import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import 'react';
import { Page, Layouts } from '@strapi/admin/strapi-admin';
import { Box } from '@strapi/design-system';
import { useDragLayer } from 'react-dnd';
import { useIntl } from 'react-intl';
import { DRAG_DROP_TYPES } from '../constants.mjs';
import { StageDragPreview } from './StageDragPreview.mjs';

function getStyle(initialOffset, currentOffset, mouseOffset) {
    if (!initialOffset || !currentOffset || !mouseOffset) {
        return {
            display: 'none'
        };
    }
    const { x, y } = mouseOffset;
    return {
        transform: `translate(${x}px, ${y}px)`
    };
}
const DragLayerRendered = ()=>{
    const { itemType, isDragging, item, initialOffset, currentOffset, mouseOffset } = useDragLayer((monitor)=>({
            item: monitor.getItem(),
            itemType: monitor.getItemType(),
            initialOffset: monitor.getInitialSourceClientOffset(),
            currentOffset: monitor.getSourceClientOffset(),
            isDragging: monitor.isDragging(),
            mouseOffset: monitor.getClientOffset()
        }));
    if (!isDragging || itemType !== DRAG_DROP_TYPES.STAGE) {
        return null;
    }
    return /*#__PURE__*/ jsx(Box, {
        height: "100%",
        left: 0,
        position: "fixed",
        pointerEvents: "none",
        top: 0,
        zIndex: 100,
        width: "100%",
        children: /*#__PURE__*/ jsxs(Box, {
            style: getStyle(initialOffset, currentOffset, mouseOffset),
            children: [
                /*#__PURE__*/ jsx(StageDragPreview, {
                    name: typeof item.item === 'string' ? item.item : null
                }),
                ";"
            ]
        })
    });
};
const Root = ({ children })=>{
    return /*#__PURE__*/ jsx(Page.Main, {
        children: /*#__PURE__*/ jsx(Layouts.Content, {
            children: children
        })
    });
};
const Header = ({ title, subtitle, navigationAction, primaryAction })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: title
                })
            }),
            /*#__PURE__*/ jsx(Layouts.BaseHeader, {
                navigationAction: navigationAction,
                primaryAction: primaryAction,
                title: title,
                subtitle: subtitle
            })
        ]
    });
};

export { DragLayerRendered, Header, Root };
//# sourceMappingURL=Layout.mjs.map
