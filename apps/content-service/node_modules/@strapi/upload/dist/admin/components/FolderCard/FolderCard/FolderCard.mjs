import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, Flex, CardAction } from '@strapi/design-system';
import { Folder } from '@strapi/icons';
import { NavLink } from 'react-router-dom';
import { styled } from 'styled-components';
import { FolderCardContext } from '../contexts/FolderCard.mjs';

const FauxClickWrapper = styled.button`
  height: 100%;
  left: 0;
  position: absolute;
  opacity: 0;
  top: 0;
  width: 100%;

  &:hover,
  &:focus {
    text-decoration: none;
  }
`;
const StyledFolder = styled(Folder)`
  path {
    fill: currentColor;
  }
`;
const CardActionDisplay = styled(Box)`
  display: none;
`;
const Card = styled(Box)`
  &:hover,
  &:focus-within {
    ${CardActionDisplay} {
      display: ${({ $isCardActions })=>$isCardActions ? 'block' : ''};
    }
  }
`;
const FolderCard = /*#__PURE__*/ React.forwardRef(({ children, startAction = null, cardActions = null, ariaLabel, onClick, to, ...props }, ref)=>{
    const generatedId = React.useId();
    const fodlerCtxValue = React.useMemo(()=>({
            id: generatedId
        }), [
        generatedId
    ]);
    return /*#__PURE__*/ jsx(FolderCardContext.Provider, {
        value: fodlerCtxValue,
        children: /*#__PURE__*/ jsxs(Card, {
            position: "relative",
            tabIndex: 0,
            $isCardActions: !!cardActions,
            ref: ref,
            ...props,
            children: [
                /*#__PURE__*/ jsx(FauxClickWrapper, {
                    to: to || undefined,
                    as: to ? NavLink : 'button',
                    type: to ? undefined : 'button',
                    onClick: onClick,
                    tabIndex: -1,
                    "aria-label": ariaLabel,
                    "aria-hidden": true
                }),
                /*#__PURE__*/ jsxs(Flex, {
                    hasRadius: true,
                    borderStyle: "solid",
                    borderWidth: "1px",
                    borderColor: "neutral150",
                    background: "neutral0",
                    shadow: "tableShadow",
                    padding: 3,
                    gap: 2,
                    cursor: "pointer",
                    children: [
                        startAction,
                        /*#__PURE__*/ jsx(Box, {
                            hasRadius: true,
                            background: "secondary100",
                            color: "secondary500",
                            paddingBottom: 2,
                            paddingLeft: 3,
                            paddingRight: 3,
                            paddingTop: 2,
                            children: /*#__PURE__*/ jsx(StyledFolder, {
                                width: "2.4rem",
                                height: "2.4rem"
                            })
                        }),
                        children,
                        /*#__PURE__*/ jsx(CardActionDisplay, {
                            children: /*#__PURE__*/ jsx(CardAction, {
                                right: 4,
                                position: "end",
                                children: cardActions
                            })
                        })
                    ]
                })
            ]
        })
    });
});

export { FolderCard };
//# sourceMappingURL=FolderCard.mjs.map
