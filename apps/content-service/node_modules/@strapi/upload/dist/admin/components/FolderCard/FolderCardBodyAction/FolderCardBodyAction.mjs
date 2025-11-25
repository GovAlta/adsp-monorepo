import { jsx } from 'react/jsx-runtime';
import { Box } from '@strapi/design-system';
import { NavLink } from 'react-router-dom';
import { styled } from 'styled-components';

// TODO: find a better naming convention for the file that was an index file before
const BoxOutline = styled(Box)`
  &:focus {
    outline: 2px solid ${({ theme })=>theme.colors.primary600};
    outline-offset: -2px;
  }
`;
const BoxTextDecoration = styled(BoxOutline)`
  text-decoration: none;
`;
const FolderCardBodyAction = ({ to, ...props })=>{
    if (to) {
        return /*#__PURE__*/ jsx(BoxTextDecoration, {
            // padding needed to give outline space to appear
            // since FolderCardBody needs overflow hidden property
            padding: 1,
            tag: NavLink,
            maxWidth: "100%",
            to: to,
            ...props
        });
    }
    return /*#__PURE__*/ jsx(BoxOutline, {
        padding: 1,
        tag: "button",
        type: "button",
        maxWidth: "100%",
        ...props
    });
};

export { FolderCardBodyAction };
//# sourceMappingURL=FolderCardBodyAction.mjs.map
