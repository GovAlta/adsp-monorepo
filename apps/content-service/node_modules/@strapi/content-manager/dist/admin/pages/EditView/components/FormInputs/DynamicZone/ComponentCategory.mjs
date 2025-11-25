import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Accordion, Box, Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { ComponentIcon } from '../../../../../components/ComponentIcon.mjs';

const ComponentCategory = ({ category, components = [], variant = 'primary', onAddComponent })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Accordion.Item, {
        value: category,
        children: [
            /*#__PURE__*/ jsx(Accordion.Header, {
                variant: variant,
                children: /*#__PURE__*/ jsx(Accordion.Trigger, {
                    children: formatMessage({
                        id: category,
                        defaultMessage: category
                    })
                })
            }),
            /*#__PURE__*/ jsx(ResponsiveAccordionContent, {
                children: /*#__PURE__*/ jsx(Grid, {
                    paddingTop: 4,
                    paddingBottom: 4,
                    paddingLeft: 3,
                    paddingRight: 3,
                    children: components.map(({ uid, displayName, icon })=>/*#__PURE__*/ jsx(ComponentBox, {
                            tag: "button",
                            type: "button",
                            background: "neutral100",
                            justifyContent: "center",
                            onClick: onAddComponent(uid),
                            hasRadius: true,
                            height: "8.4rem",
                            shrink: 0,
                            borderColor: "neutral200",
                            children: /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                gap: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                children: [
                                    /*#__PURE__*/ jsx(ComponentIcon, {
                                        color: "currentColor",
                                        background: "primary200",
                                        icon: icon
                                    }),
                                    /*#__PURE__*/ jsx(Typography, {
                                        variant: "pi",
                                        fontWeight: "bold",
                                        children: displayName
                                    })
                                ]
                            })
                        }, uid))
                })
            })
        ]
    });
};
const ResponsiveAccordionContent = styled(Accordion.Content)`
  container-type: inline-size;
`;
/**
 * TODO:
 * JSDOM cannot handle container queries.
 * This is a temporary workaround so that tests do not fail in the CI when jestdom throws an error
 * for failing to parse the stylesheet.
 */ const Grid = process.env.NODE_ENV !== 'test' ? styled(Box)`
        display: grid;
        grid-template-columns: repeat(auto-fill, 100%);
        grid-gap: 4px;

        ${({ theme })=>theme.breakpoints.medium} {
          grid-template-columns: repeat(auto-fill, 14rem);
        }
      ` : styled(Box)`
        display: grid;
        grid-template-columns: repeat(auto-fill, 100%);
        grid-gap: 4px;
      `;
const ComponentBox = styled(Flex)`
  color: ${({ theme })=>theme.colors.neutral600};
  cursor: pointer;

  @media (prefers-reduced-motion: no-preference) {
    transition: color 120ms ${(props)=>props.theme.motion.easings.easeOutQuad};
  }

  &:focus,
  &:hover {
    border: 1px solid ${({ theme })=>theme.colors.primary200};
    background: ${({ theme })=>theme.colors.primary100};
    color: ${({ theme })=>theme.colors.primary600};
  }
`;

export { ComponentCategory };
//# sourceMappingURL=ComponentCategory.mjs.map
