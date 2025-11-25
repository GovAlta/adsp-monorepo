import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Flex, Box, Typography } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { getTrad } from '../utils/getTrad.mjs';
import { ComponentCard } from './ComponentCard/ComponentCard.mjs';
import { ComponentList } from './ComponentList.mjs';
import { ComponentRow } from './ComponentRow.mjs';
import { useDataManager } from './DataManager/useDataManager.mjs';

const StyledAddIcon = styled(Plus)`
  width: 3.2rem;
  height: 3.2rem;
  padding: 0.9rem;
  border-radius: 6.4rem;
  background: ${({ theme, disabled })=>disabled ? theme.colors.neutral100 : theme.colors.primary100};
  path {
    fill: ${({ theme, disabled })=>disabled ? theme.colors.neutral600 : theme.colors.primary600};
  }
`;
const ComponentStack = styled(Flex)`
  flex-shrink: 0;
  width: 14rem;
  height: 8rem;
  justify-content: center;
  align-items: center;
`;
const DynamicZoneList = ({ components = [], addComponent, name, forTarget, targetUid, disabled = false })=>{
    const { isInDevelopmentMode } = useDataManager();
    const [activeTab, setActiveTab] = useState(0);
    const { formatMessage } = useIntl();
    const toggle = (tab)=>{
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };
    const handleClickAdd = ()=>{
        addComponent(name);
    };
    return /*#__PURE__*/ jsx(ComponentRow, {
        className: "dynamiczone-row",
        $isFromDynamicZone: true,
        children: /*#__PURE__*/ jsxs(Box, {
            children: [
                /*#__PURE__*/ jsx(Box, {
                    padding: 2,
                    paddingLeft: "104px",
                    children: /*#__PURE__*/ jsxs(Flex, {
                        role: "tablist",
                        gap: 2,
                        wrap: "wrap",
                        children: [
                            isInDevelopmentMode && /*#__PURE__*/ jsx("button", {
                                type: "button",
                                onClick: handleClickAdd,
                                disabled: disabled,
                                style: {
                                    cursor: disabled ? 'not-allowed' : 'pointer'
                                },
                                children: /*#__PURE__*/ jsxs(ComponentStack, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 1,
                                    children: [
                                        /*#__PURE__*/ jsx(StyledAddIcon, {
                                            disabled: disabled
                                        }),
                                        /*#__PURE__*/ jsx(Typography, {
                                            variant: "pi",
                                            fontWeight: "bold",
                                            textColor: disabled ? 'neutral600' : 'primary600',
                                            children: formatMessage({
                                                id: getTrad('button.component.add'),
                                                defaultMessage: 'Add a component'
                                            })
                                        })
                                    ]
                                })
                            }),
                            components.map((component, index)=>{
                                return /*#__PURE__*/ jsx(ComponentCard, {
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
                /*#__PURE__*/ jsx(Box, {
                    children: components.map((component, index)=>{
                        return /*#__PURE__*/ jsx(Box, {
                            id: `dz-${name}-panel-${index}`,
                            role: "tabpanel",
                            "aria-labelledby": `dz-${name}-tab-${index}`,
                            style: {
                                display: activeTab === index ? 'block' : 'none'
                            },
                            children: /*#__PURE__*/ jsx(ComponentList, {
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

export { DynamicZoneList };
//# sourceMappingURL=DynamicZoneList.mjs.map
