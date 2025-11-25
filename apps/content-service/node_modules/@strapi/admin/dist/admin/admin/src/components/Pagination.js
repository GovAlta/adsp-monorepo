'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var useQueryParams = require('../hooks/useQueryParams.js');
var Context = require('./Context.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const [PaginationProvider, usePagination] = Context.createContext('Pagination');
/**
 * @description The root component for the composable pagination component.
 * It's advised to spread the entire pagination option object into this component.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *  return (
 *    <Pagination.Root {...response.pagination}>
 *      <Pagination.PageSize />
 *      <Pagination.Links />
 *    </Pagination.Root>
 *  );
 * };
 * ```
 */ const Root = /*#__PURE__*/ React__namespace.forwardRef(({ children, defaultPageSize = 10, pageCount = 0, defaultPage = 1, onPageSizeChange, total = 0 }, forwardedRef)=>{
    const [{ query }, setQuery] = useQueryParams.useQueryParams({
        pageSize: defaultPageSize.toString(),
        page: defaultPage.toString()
    });
    const setPageSize = (pageSize)=>{
        setQuery({
            pageSize,
            page: '1'
        });
        if (onPageSizeChange) {
            onPageSizeChange(pageSize);
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        ref: forwardedRef,
        paddingTop: 4,
        paddingBottom: 4,
        alignItems: "flex-end",
        justifyContent: "space-between",
        children: /*#__PURE__*/ jsxRuntime.jsx(PaginationProvider, {
            currentQuery: query,
            page: query.page,
            pageSize: query.pageSize,
            pageCount: pageCount.toString(),
            setPageSize: setPageSize,
            total: total,
            children: children
        })
    });
});
/* -------------------------------------------------------------------------------------------------
 * PageSize
 * -----------------------------------------------------------------------------------------------*/ /**
 * @description The page size component is responsible for rendering the select input that allows
 * the user to change the number of items displayed per page.
 * If the total number of items is less than the minimum option, this component will not render.
 */ const PageSize = ({ options = [
    '10',
    '20',
    '50',
    '100'
] })=>{
    const { formatMessage } = reactIntl.useIntl();
    const pageSize = usePagination('PageSize', (state)=>state.pageSize);
    const totalCount = usePagination('PageSize', (state)=>state.total);
    const setPageSize = usePagination('PageSize', (state)=>state.setPageSize);
    const handleChange = (value)=>{
        setPageSize(value);
    };
    const minimumOption = parseInt(options[0], 10);
    if (minimumOption >= totalCount) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        gap: 2,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                size: "S",
                "aria-label": formatMessage({
                    id: 'components.PageFooter.select',
                    defaultMessage: 'Entries per page'
                }),
                // @ts-expect-error from the DS V2 this won't be needed because we're only returning strings.
                onChange: handleChange,
                value: pageSize,
                children: options.map((option)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: option,
                        children: option
                    }, option))
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: "neutral600",
                tag: "span",
                children: formatMessage({
                    id: 'components.PageFooter.select',
                    defaultMessage: 'Entries per page'
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Links
 * -----------------------------------------------------------------------------------------------*/ /**
 * The component works as follows
 * `1` , 2, 3, ... 10
 * 1, `2`, 3, ... 10
 * 1, 2, `3`, 4, ... 10
 * 1, 2, 3, `4`, 5, ... 10
 * 1, ..,4, `5`, 6, ... 10
 *
 * 1, ...., 8, 9, `10`
 * 1, ...., 8, `9`, 10
 * 1, ...., 7, `8`, 9, 10
 * 1, ... 6, `7`, 8, 9, 10
 */ /**
 * @description The links component is responsible for rendering the pagination links.
 * If the total number of pages is less than or equal to 1, this component will not render.
 */ const Links = ({ boundaryCount = 1, siblingCount = 1 })=>{
    const { formatMessage } = reactIntl.useIntl();
    const query = usePagination('Links', (state)=>state.currentQuery);
    const currentPage = usePagination('Links', (state)=>state.page);
    const totalPages = usePagination('Links', (state)=>state.pageCount);
    const pageCount = parseInt(totalPages, 10);
    const activePage = parseInt(currentPage, 10);
    const range = (start, end)=>{
        const length = end - start + 1;
        return Array.from({
            length
        }, (_, i)=>start + i);
    };
    const startPages = range(1, Math.min(boundaryCount, pageCount));
    const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);
    const siblingsStart = Math.max(Math.min(// Natural start
    activePage - siblingCount, // Lower boundary when page is high
    pageCount - boundaryCount - siblingCount * 2 - 1), // Greater than startPages
    boundaryCount + 2);
    const siblingsEnd = Math.min(Math.max(// Natural end
    activePage + siblingCount, // Upper boundary when page is low
    boundaryCount + siblingCount * 2 + 2), // Less than endPages
    endPages.length > 0 ? endPages[0] - 2 : pageCount - 1);
    const items = [
        ...startPages,
        // Start ellipsis
        // eslint-disable-next-line no-nested-ternary
        ...siblingsStart > boundaryCount + 2 ? [
            'start-ellipsis'
        ] : boundaryCount + 1 < pageCount - boundaryCount ? [
            boundaryCount + 1
        ] : [],
        // Sibling pages
        ...range(siblingsStart, siblingsEnd),
        // End ellipsis
        // eslint-disable-next-line no-nested-ternary
        ...siblingsEnd < pageCount - boundaryCount - 1 ? [
            'end-ellipsis'
        ] : pageCount - boundaryCount > boundaryCount ? [
            pageCount - boundaryCount
        ] : [],
        ...endPages
    ];
    if (pageCount <= 1) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Pagination, {
        activePage: activePage,
        pageCount: pageCount,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.PreviousLink, {
                tag: reactRouterDom.Link,
                to: {
                    search: qs.stringify({
                        ...query,
                        page: activePage - 1
                    })
                },
                children: formatMessage({
                    id: 'components.pagination.go-to-previous',
                    defaultMessage: 'Go to previous page'
                })
            }),
            items.map((item)=>{
                if (typeof item === 'number') {
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.PageLink, {
                        tag: reactRouterDom.Link,
                        number: item,
                        to: {
                            search: qs.stringify({
                                ...query,
                                page: item
                            })
                        },
                        children: formatMessage({
                            id: 'components.pagination.go-to',
                            defaultMessage: 'Go to page {page}'
                        }, {
                            page: item
                        })
                    }, item);
                }
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dots, {}, item);
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.NextLink, {
                tag: reactRouterDom.Link,
                to: {
                    search: qs.stringify({
                        ...query,
                        page: activePage + 1
                    })
                },
                children: formatMessage({
                    id: 'components.pagination.go-to-next',
                    defaultMessage: 'Go to next page'
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * EXPORTS
 * -----------------------------------------------------------------------------------------------*/ const Pagination = {
    Root,
    Links,
    PageSize
};

exports.Pagination = Pagination;
//# sourceMappingURL=Pagination.js.map
