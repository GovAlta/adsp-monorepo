import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, Button } from '@strapi/design-system';
import { Cog } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';

const ConditionsButtonImpl = /*#__PURE__*/ React.forwardRef(({ onClick, className, hasConditions = false, variant = 'tertiary' }, ref)=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(ButtonContainer, {
        $hasConditions: hasConditions,
        className: className,
        children: /*#__PURE__*/ jsx(Button, {
            variant: variant,
            startIcon: /*#__PURE__*/ jsx(Cog, {}),
            onClick: onClick,
            ref: ref,
            type: "button",
            children: formatMessage({
                id: 'global.settings',
                defaultMessage: 'Settings'
            })
        })
    });
});
const ButtonContainer = styled(Box)`
  ${({ $hasConditions, theme })=>$hasConditions && `
    &:before {
      content: '';
      position: absolute;
      top: -3px;
      left: -10px;
      width: 6px;
      height: 6px;
      border-radius: 2rem;
      background: ${theme.colors.primary600};
    }
  `}
`;
/**
 * We reference the component directly in other styled-components
 * and as such we need it to have a className already assigned.
 * Therefore we wrapped the implementation in a styled function.
 */ const ConditionsButton = styled(ConditionsButtonImpl)``;

export { ConditionsButton };
//# sourceMappingURL=ConditionsButton.mjs.map
