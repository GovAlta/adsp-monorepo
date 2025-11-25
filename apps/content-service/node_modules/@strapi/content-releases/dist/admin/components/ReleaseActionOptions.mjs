import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Field, Flex, VisuallyHidden } from '@strapi/design-system';
import { styled } from 'styled-components';

const getBorderLeftRadiusValue = (actionType)=>{
    return actionType === 'publish' ? 1 : 0;
};
const getBorderRightRadiusValue = (actionType)=>{
    return actionType === 'publish' ? 0 : 1;
};
const FieldWrapper = styled(Field.Root)`
  border-top-left-radius: ${({ $actionType, theme })=>theme.spaces[getBorderLeftRadiusValue($actionType)]};
  border-bottom-left-radius: ${({ $actionType, theme })=>theme.spaces[getBorderLeftRadiusValue($actionType)]};
  border-top-right-radius: ${({ $actionType, theme })=>theme.spaces[getBorderRightRadiusValue($actionType)]};
  border-bottom-right-radius: ${({ $actionType, theme })=>theme.spaces[getBorderRightRadiusValue($actionType)]};

  > label {
    color: inherit;
    padding: ${({ theme })=>`${theme.spaces[2]} ${theme.spaces[3]}`};
    text-align: center;
    vertical-align: middle;
    text-transform: capitalize;
  }

  &[data-checked='true'] {
    color: ${({ theme, $actionType })=>$actionType === 'publish' ? theme.colors.primary700 : theme.colors.danger600};
    background-color: ${({ theme, $actionType })=>$actionType === 'publish' ? theme.colors.primary100 : theme.colors.danger100};
    border-color: ${({ theme, $actionType })=>$actionType === 'publish' ? theme.colors.primary700 : theme.colors.danger600};
  }

  &[data-checked='false'] {
    border-left: ${({ $actionType })=>$actionType === 'unpublish' && 'none'};
    border-right: ${({ $actionType })=>$actionType === 'publish' && 'none'};
  }

  &[data-checked='false'][data-disabled='false']:hover {
    color: ${({ theme })=>theme.colors.neutral700};
    background-color: ${({ theme })=>theme.colors.neutral100};
    border-color: ${({ theme })=>theme.colors.neutral200};

    & > label {
      cursor: pointer;
    }
  }

  &[data-disabled='true'] {
    color: ${({ theme })=>theme.colors.neutral600};
    background-color: ${({ theme })=>theme.colors.neutral150};
    border-color: ${({ theme })=>theme.colors.neutral300};
  }
`;
const ActionOption = ({ selected, actionType, handleChange, name, disabled = false })=>{
    return /*#__PURE__*/ jsx(FieldWrapper, {
        $actionType: actionType,
        background: "primary0",
        borderColor: "neutral200",
        color: selected === actionType ? 'primary600' : 'neutral600',
        position: "relative",
        cursor: "pointer",
        "data-checked": selected === actionType,
        "data-disabled": disabled && selected !== actionType,
        children: /*#__PURE__*/ jsxs(Field.Label, {
            children: [
                /*#__PURE__*/ jsx(VisuallyHidden, {
                    children: /*#__PURE__*/ jsx(Field.Input, {
                        type: "radio",
                        name: name,
                        checked: selected === actionType,
                        onChange: handleChange,
                        value: actionType,
                        disabled: disabled
                    })
                }),
                actionType
            ]
        })
    });
};
const ReleaseActionOptions = ({ selected, handleChange, name, disabled = false })=>{
    return /*#__PURE__*/ jsxs(Flex, {
        children: [
            /*#__PURE__*/ jsx(ActionOption, {
                actionType: "publish",
                selected: selected,
                handleChange: handleChange,
                name: name,
                disabled: disabled
            }),
            /*#__PURE__*/ jsx(ActionOption, {
                actionType: "unpublish",
                selected: selected,
                handleChange: handleChange,
                name: name,
                disabled: disabled
            })
        ]
    });
};

export { ReleaseActionOptions };
//# sourceMappingURL=ReleaseActionOptions.mjs.map
