'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactDnd = require('react-dnd');
var reactIntl = require('react-intl');
var constants = require('../constants.js');
var StageDragPreview = require('./StageDragPreview.js');

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
    const { itemType, isDragging, item, initialOffset, currentOffset, mouseOffset } = reactDnd.useDragLayer((monitor)=>({
            item: monitor.getItem(),
            itemType: monitor.getItemType(),
            initialOffset: monitor.getInitialSourceClientOffset(),
            currentOffset: monitor.getSourceClientOffset(),
            isDragging: monitor.isDragging(),
            mouseOffset: monitor.getClientOffset()
        }));
    if (!isDragging || itemType !== constants.DRAG_DROP_TYPES.STAGE) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        height: "100%",
        left: 0,
        position: "fixed",
        pointerEvents: "none",
        top: 0,
        zIndex: 100,
        width: "100%",
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
            style: getStyle(initialOffset, currentOffset, mouseOffset),
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(StageDragPreview.StageDragPreview, {
                    name: typeof item.item === 'string' ? item.item : null
                }),
                ";"
            ]
        })
    });
};
const Root = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Main, {
        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
            children: children
        })
    });
};
const Header = ({ title, subtitle, navigationAction, primaryAction })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: title
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.BaseHeader, {
                navigationAction: navigationAction,
                primaryAction: primaryAction,
                title: title,
                subtitle: subtitle
            })
        ]
    });
};

exports.DragLayerRendered = DragLayerRendered;
exports.Header = Header;
exports.Root = Root;
//# sourceMappingURL=Layout.js.map
