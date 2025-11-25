import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { KeyboardNavigable, Box, Typography, Grid } from '@strapi/design-system';

const FolderGridList = ({ title = null, children })=>{
    return /*#__PURE__*/ jsxs(KeyboardNavigable, {
        tagName: "article",
        children: [
            title && /*#__PURE__*/ jsx(Box, {
                paddingBottom: 2,
                children: /*#__PURE__*/ jsx(Typography, {
                    tag: "h2",
                    variant: "delta",
                    fontWeight: "semiBold",
                    children: title
                })
            }),
            /*#__PURE__*/ jsx(Grid.Root, {
                gap: 4,
                children: children
            })
        ]
    });
};

export { FolderGridList };
//# sourceMappingURL=FolderGridList.mjs.map
