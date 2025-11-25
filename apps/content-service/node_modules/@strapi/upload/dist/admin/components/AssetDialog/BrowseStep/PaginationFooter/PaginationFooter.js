'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var Pagination = require('./Pagination.js');

// TODO: find a better naming convention for the file that was an index file before
const PaginationText = styledComponents.styled(designSystem.Typography)`
  line-height: revert;
`;
const linkWrapperStyles = styledComponents.css`
  padding: ${({ theme })=>theme.spaces[3]};
  border-radius: ${({ theme })=>theme.borderRadius};
  box-shadow: ${({ $active, theme })=>$active ? theme.shadows.filterShadow : undefined};
  text-decoration: none;
  display: flex;
  position: relative;
  outline: none;

  &:after {
    transition-property: all;
    transition-duration: 0.2s;
    border-radius: 8px;
    content: '';
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border: 2px solid transparent;
  }

  &:focus-visible {
    outline: none;

    &:after {
      border-radius: 8px;
      content: '';
      position: absolute;
      top: -5px;
      bottom: -5px;
      left: -5px;
      right: -5px;
      border: 2px solid ${(props)=>props.theme.colors.primary600};
    }
  }
`;
const LinkWrapperButton = styledComponents.styled.button`
  ${linkWrapperStyles}
`;
const LinkWrapperDiv = styledComponents.styled.div`
  ${linkWrapperStyles}
`;
LinkWrapperButton.defaultProps = {
    type: 'button'
};
const PageLinkWrapper = styledComponents.styled(LinkWrapperButton)`
  color: ${({ theme, $active })=>$active ? theme.colors.primary700 : theme.colors.neutral800};
  background: ${({ theme, $active })=>$active ? theme.colors.neutral0 : undefined};

  &:hover {
    box-shadow: ${({ theme })=>theme.shadows.filterShadow};
  }
`;
const ActionLinkWrapper = styledComponents.styled(LinkWrapperButton)`
  font-size: 1.1rem;
  svg path {
    fill: ${(p)=>p['aria-disabled'] ? p.theme.colors.neutral300 : p.theme.colors.neutral600};
  }

  &:focus,
  &:hover {
    svg path {
      fill: ${(p)=>p['aria-disabled'] ? p.theme.colors.neutral300 : p.theme.colors.neutral700};
    }
  }

  ${(p)=>p['aria-disabled'] ? `
  pointer-events: none;
    ` : undefined}
`;
const DotsWrapper = styledComponents.styled(LinkWrapperDiv)`
  color: ${({ theme })=>theme.colors.neutral800};
`;
const PreviousLink = ({ children, ...props })=>{
    const { activePage } = Pagination.usePagination();
    const disabled = activePage === 1;
    return /*#__PURE__*/ jsxRuntime.jsx("li", {
        children: /*#__PURE__*/ jsxRuntime.jsxs(ActionLinkWrapper, {
            "aria-disabled": disabled,
            tabIndex: disabled ? -1 : undefined,
            ...props,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                    children: children
                }),
                /*#__PURE__*/ jsxRuntime.jsx(icons.ChevronLeft, {
                    "aria-hidden": true
                })
            ]
        })
    });
};
const NextLink = ({ children, ...props })=>{
    const { activePage, pageCount } = Pagination.usePagination();
    const disabled = activePage === pageCount;
    return /*#__PURE__*/ jsxRuntime.jsx("li", {
        children: /*#__PURE__*/ jsxRuntime.jsxs(ActionLinkWrapper, {
            "aria-disabled": disabled,
            tabIndex: disabled ? -1 : undefined,
            ...props,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                    children: children
                }),
                /*#__PURE__*/ jsxRuntime.jsx(icons.ChevronRight, {
                    "aria-hidden": true
                })
            ]
        })
    });
};
const PageLink = ({ number, children, ...props })=>{
    const { activePage } = Pagination.usePagination();
    const isActive = activePage === number;
    return /*#__PURE__*/ jsxRuntime.jsx("li", {
        children: /*#__PURE__*/ jsxRuntime.jsxs(PageLinkWrapper, {
            ...props,
            $active: isActive,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                    children: children
                }),
                /*#__PURE__*/ jsxRuntime.jsx(PaginationText, {
                    "aria-hidden": true,
                    variant: "pi",
                    fontWeight: isActive ? 'bold' : '',
                    children: number
                })
            ]
        })
    });
};
const Dots = ({ children, ...props })=>/*#__PURE__*/ jsxRuntime.jsx("li", {
        children: /*#__PURE__*/ jsxRuntime.jsxs(DotsWrapper, {
            ...props,
            as: "div",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                    children: children
                }),
                /*#__PURE__*/ jsxRuntime.jsx(PaginationText, {
                    "aria-hidden": true,
                    small: true,
                    children: "…"
                })
            ]
        })
    });
const PaginationFooter = ({ activePage, onChangePage, pagination: { pageCount } })=>{
    const { formatMessage } = reactIntl.useIntl();
    const previousActivePage = activePage - 1;
    const nextActivePage = activePage + 1;
    const firstLinks = [
        /*#__PURE__*/ jsxRuntime.jsx(PageLink, {
            number: 1,
            onClick: ()=>{
                onChangePage(1);
            },
            children: formatMessage({
                id: 'components.pagination.go-to',
                defaultMessage: 'Go to page {page}'
            }, {
                page: 1
            })
        }, 1)
    ];
    if (pageCount <= 4) {
        const links = Array.from({
            length: pageCount
        }).map((_, i)=>i + 1).map((number)=>{
            return /*#__PURE__*/ jsxRuntime.jsx(PageLink, {
                number: number,
                onClick: ()=>onChangePage(number),
                children: formatMessage({
                    id: 'components.pagination.go-to',
                    defaultMessage: 'Go to page {page}'
                }, {
                    page: number
                })
            }, number);
        });
        return /*#__PURE__*/ jsxRuntime.jsxs(Pagination.Pagination, {
            activePage: activePage,
            pageCount: pageCount,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(PreviousLink, {
                    onClick: ()=>onChangePage(previousActivePage),
                    children: formatMessage({
                        id: 'components.pagination.go-to-previous',
                        defaultMessage: 'Go to previous page'
                    })
                }),
                links,
                /*#__PURE__*/ jsxRuntime.jsx(NextLink, {
                    onClick: ()=>onChangePage(nextActivePage),
                    children: formatMessage({
                        id: 'components.pagination.go-to-next',
                        defaultMessage: 'Go to next page'
                    })
                })
            ]
        });
    }
    let firstLinksToCreate = [];
    const lastLinks = [];
    let lastLinksToCreate = [];
    const middleLinks = [];
    if (pageCount > 1) {
        lastLinks.push(/*#__PURE__*/ jsxRuntime.jsx(PageLink, {
            number: pageCount,
            onClick: ()=>onChangePage(pageCount),
            children: formatMessage({
                id: 'components.pagination.go-to',
                defaultMessage: 'Go to page {page}'
            }, {
                page: pageCount
            })
        }, pageCount));
    }
    if (activePage === 1 && pageCount >= 3) {
        firstLinksToCreate = [
            2
        ];
    }
    if (activePage === 2 && pageCount >= 3) {
        if (pageCount === 5) {
            firstLinksToCreate = [
                2,
                3,
                4
            ];
        } else if (pageCount === 3) {
            firstLinksToCreate = [
                2
            ];
        } else {
            firstLinksToCreate = [
                2,
                3
            ];
        }
    }
    if (activePage === 4 && pageCount >= 3) {
        firstLinksToCreate = [
            2
        ];
    }
    if (activePage === pageCount && pageCount >= 3) {
        lastLinksToCreate = [
            pageCount - 1
        ];
    }
    if (activePage === pageCount - 2 && pageCount > 3) {
        lastLinksToCreate = [
            activePage + 1,
            activePage,
            activePage - 1
        ];
    }
    if (activePage === pageCount - 3 && pageCount > 3 && activePage > 5) {
        lastLinksToCreate = [
            activePage + 2,
            activePage + 1,
            activePage,
            activePage - 1
        ];
    }
    if (activePage === pageCount - 1 && pageCount > 3) {
        lastLinksToCreate = [
            activePage,
            activePage - 1
        ];
    }
    lastLinksToCreate.forEach((number)=>{
        lastLinks.unshift(/*#__PURE__*/ jsxRuntime.jsxs(PageLink, {
            number: number,
            onClick: ()=>onChangePage(number),
            children: [
                "Go to page ",
                number
            ]
        }, number));
    });
    firstLinksToCreate.forEach((number)=>{
        firstLinks.push(/*#__PURE__*/ jsxRuntime.jsx(PageLink, {
            number: number,
            onClick: ()=>onChangePage(number),
            children: formatMessage({
                id: 'components.pagination.go-to',
                defaultMessage: 'Go to page {page}'
            }, {
                page: number
            })
        }, number));
    });
    if (![
        1,
        2
    ].includes(activePage) && activePage <= pageCount - 3 && firstLinks.length + lastLinks.length < 6) {
        const middleLinksToCreate = [
            activePage - 1,
            activePage,
            activePage + 1
        ];
        middleLinksToCreate.forEach((number)=>{
            middleLinks.push(/*#__PURE__*/ jsxRuntime.jsx(PageLink, {
                number: number,
                onClick: ()=>onChangePage(number),
                children: formatMessage({
                    id: 'components.pagination.go-to',
                    defaultMessage: 'Go to page {page}'
                }, {
                    page: number
                })
            }, number));
        });
    }
    const shouldShowDotsAfterFirstLink = pageCount > 5 || pageCount === 5 && (activePage === 1 || activePage === 5);
    const shouldShowMiddleDots = middleLinks.length > 2 && activePage > 4 && pageCount > 5;
    const beforeDotsLinksLength = shouldShowMiddleDots ? pageCount - activePage - 1 : pageCount - firstLinks.length - lastLinks.length;
    const afterDotsLength = shouldShowMiddleDots ? pageCount - firstLinks.length - lastLinks.length : pageCount - activePage - 1;
    return /*#__PURE__*/ jsxRuntime.jsxs(Pagination.Pagination, {
        activePage: activePage,
        pageCount: pageCount,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PreviousLink, {
                onClick: ()=>onChangePage(previousActivePage),
                children: formatMessage({
                    id: 'components.pagination.go-to-previous',
                    defaultMessage: 'Go to previous page'
                })
            }),
            firstLinks,
            shouldShowMiddleDots && /*#__PURE__*/ jsxRuntime.jsx(Dots, {
                children: formatMessage({
                    id: 'components.pagination.remaining-links',
                    defaultMessage: 'And {number} other links'
                }, {
                    number: beforeDotsLinksLength
                })
            }),
            middleLinks,
            shouldShowDotsAfterFirstLink && /*#__PURE__*/ jsxRuntime.jsx(Dots, {
                children: formatMessage({
                    id: 'components.pagination.remaining-links',
                    defaultMessage: 'And {number} other links'
                }, {
                    number: afterDotsLength
                })
            }),
            lastLinks,
            /*#__PURE__*/ jsxRuntime.jsx(NextLink, {
                onClick: ()=>onChangePage(nextActivePage),
                children: formatMessage({
                    id: 'components.pagination.go-to-next',
                    defaultMessage: 'Go to next page'
                })
            })
        ]
    });
};

exports.PaginationFooter = PaginationFooter;
//# sourceMappingURL=PaginationFooter.js.map
