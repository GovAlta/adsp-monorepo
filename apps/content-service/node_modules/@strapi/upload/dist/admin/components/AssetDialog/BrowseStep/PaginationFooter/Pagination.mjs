import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, Flex } from '@strapi/design-system';

const PaginationContext = /*#__PURE__*/ React.createContext({
    activePage: 1,
    pageCount: 1
});
const usePagination = ()=>React.useContext(PaginationContext);
const Pagination = ({ children, activePage, pageCount, label = 'pagination' })=>{
    const paginationValue = React.useMemo(()=>({
            activePage,
            pageCount
        }), [
        activePage,
        pageCount
    ]);
    return /*#__PURE__*/ jsx(PaginationContext.Provider, {
        value: paginationValue,
        children: /*#__PURE__*/ jsx(Box, {
            tag: "nav",
            "aria-label": label,
            children: /*#__PURE__*/ jsx(Flex, {
                tag: "ul",
                gap: 1,
                children: children
            })
        })
    });
};

export { Pagination, usePagination };
//# sourceMappingURL=Pagination.mjs.map
