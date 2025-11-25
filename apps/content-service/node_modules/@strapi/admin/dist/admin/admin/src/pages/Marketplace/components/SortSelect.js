'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styled = require('styled-components');

const SORT_TYPES = {
    'name:asc': {
        selected: {
            id: 'admin.pages.MarketPlacePage.sort.alphabetical.selected',
            defaultMessage: 'Sort by alphabetical order'
        },
        option: {
            id: 'admin.pages.MarketPlacePage.sort.alphabetical',
            defaultMessage: 'Alphabetical order'
        }
    },
    'submissionDate:desc': {
        selected: {
            id: 'admin.pages.MarketPlacePage.sort.newest.selected',
            defaultMessage: 'Sort by newest'
        },
        option: {
            id: 'admin.pages.MarketPlacePage.sort.newest',
            defaultMessage: 'Newest'
        }
    },
    'githubStars:desc': {
        selected: {
            id: 'admin.pages.MarketPlacePage.sort.githubStars.selected',
            defaultMessage: 'Sort by GitHub stars'
        },
        option: {
            id: 'admin.pages.MarketPlacePage.sort.githubStars',
            defaultMessage: 'Number of GitHub stars'
        }
    },
    'npmDownloads:desc': {
        selected: {
            id: 'admin.pages.MarketPlacePage.sort.npmDownloads.selected',
            defaultMessage: 'Sort by npm downloads'
        },
        option: {
            id: 'admin.pages.MarketPlacePage.sort.npmDownloads',
            defaultMessage: 'Number of downloads'
        }
    }
};
const SortSelect = ({ sortQuery, handleSelectChange })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(SelectWrapper, {
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
            value: sortQuery,
            customizeContent: ()=>formatMessage(SORT_TYPES[sortQuery].selected),
            onChange: (sortName)=>{
                // @ts-expect-error – in V2 design-system we'll only ever return strings.
                handleSelectChange({
                    sort: sortName
                });
            },
            "aria-label": formatMessage({
                id: 'admin.pages.MarketPlacePage.sort.label',
                defaultMessage: 'Sort by'
            }),
            size: "S",
            children: Object.entries(SORT_TYPES).map(([sortName, messages])=>{
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                    value: sortName,
                    children: formatMessage(messages.option)
                }, sortName);
            })
        })
    });
};
const SelectWrapper = styled.styled(designSystem.Box)`
  font-weight: ${({ theme })=>theme.fontWeights.semiBold};

  span {
    font-size: ${({ theme })=>theme.fontSizes[1]};
  }
`;

exports.SortSelect = SortSelect;
//# sourceMappingURL=SortSelect.js.map
