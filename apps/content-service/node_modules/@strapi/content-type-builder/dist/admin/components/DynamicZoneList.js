'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var getTrad = require('../utils/getTrad.js');
var ComponentCard = require('./ComponentCard/ComponentCard.js');
var ComponentList = require('./ComponentList.js');
var ComponentRow = require('./ComponentRow.js');
var useDataManager = require('./DataManager/useDataManager.js');

const StyledAddIcon = styledComponents.styled(Icons.Plus)`
  width: 3.2rem;
  height: 3.2rem;
  padding: 0.9rem;
  border-radius: 6.4rem;
  background: ${({ theme, disabled })=>disabled ? theme.colors.neutral100 : theme.colors.primary100};
  path {
    fill: ${({ theme, disabled })=>disabled ? theme.colors.neutral600 : theme.colors.primary600};
  }
`;
const ComponentStack = styledComponents.styled(designSystem.Flex)`
  flex-shrink: 0;
  width: 14rem;
  height: 8rem;
  justify-content: center;
  align-items: center;
`;
const DynamicZoneList = ({ components = [], addComponent, name, forTarget, targetUid, disabled = false })=>{
    const { isInDevelopmentMode } = useDataManager.useDataManager();
    const [activeTab, setActiveTab] = React.useState(0);
    const { formatMessage } = reactIntl.useIntl();
    const toggle = (tab)=>{
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };
    const handleClickAdd = ()=>{
        addComponent(name);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(ComponentRow.ComponentRow, {
        className: "dynamiczone-row",
        $isFromDynamicZone: true,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    padding: 2,
                    paddingLeft: "104px",
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        role: "tablist",
                        gap: 2,
                        wrap: "wrap",
                        children: [
                            isInDevelopmentMode && /*#__PURE__*/ jsxRuntime.jsx("button", {
                                type: "button",
                                onClick: handleClickAdd,
                                disabled: disabled,
                                style: {
                                    cursor: disabled ? 'not-allowed' : 'pointer'
                                },
                                children: /*#__PURE__*/ jsxRuntime.jsxs(ComponentStack, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 1,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(StyledAddIcon, {
                                            disabled: disabled
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "pi",
                                            fontWeight: "bold",
                                            textColor: disabled ? 'neutral600' : 'primary600',
                                            children: formatMessage({
                                                id: getTrad.getTrad('button.component.add'),
                                                defaultMessage: 'Add a component'
                                            })
                                        })
                                    ]
                                })
                            }),
                            components.map((component, index)=>{
                                return /*#__PURE__*/ jsxRuntime.jsx(ComponentCard.ComponentCard, {
                                    dzName: name || '',
                                    index: index,
                                    component: component,
                                    isActive: activeTab === index,
                                    isInDevelopmentMode: isInDevelopmentMode,
                                    onClick: ()=>toggle(index),
                                    forTarget: forTarget,
                                    targetUid: targetUid,
                                    disabled: disabled
                                }, component);
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    children: components.map((component, index)=>{
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            id: `dz-${name}-panel-${index}`,
                            role: "tabpanel",
                            "aria-labelledby": `dz-${name}-tab-${index}`,
                            style: {
                                display: activeTab === index ? 'block' : 'none'
                            },
                            children: /*#__PURE__*/ jsxRuntime.jsx(ComponentList.ComponentList, {
                                isFromDynamicZone: true,
                                component: component
                            }, component)
                        }, component);
                    })
                })
            ]
        })
    });
};

exports.DynamicZoneList = DynamicZoneList;
//# sourceMappingURL=DynamicZoneList.js.map
