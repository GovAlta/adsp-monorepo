'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var sortBy = require('lodash/sortBy');
var PropTypes = require('prop-types');
var SubCategory = require('./SubCategory.js');

const PermissionRow = ({ name, permissions })=>{
    const subCategories = React.useMemo(()=>{
        return sortBy(Object.values(permissions.controllers).reduce((acc, curr, index)=>{
            const currentName = `${name}.controllers.${Object.keys(permissions.controllers)[index]}`;
            const actions = sortBy(Object.keys(curr).reduce((acc, current)=>{
                return [
                    ...acc,
                    {
                        ...curr[current],
                        label: current,
                        name: `${currentName}.${current}`
                    }
                ];
            }, []), 'label');
            return [
                ...acc,
                {
                    actions,
                    label: Object.keys(permissions.controllers)[index],
                    name: currentName
                }
            ];
        }, []), 'label');
    }, [
        name,
        permissions
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: 6,
        children: subCategories.map((subCategory)=>/*#__PURE__*/ jsxRuntime.jsx(SubCategory, {
                subCategory: subCategory
            }, subCategory.name))
    });
};
PermissionRow.propTypes = {
    name: PropTypes.string.isRequired,
    permissions: PropTypes.object.isRequired
};

module.exports = PermissionRow;
//# sourceMappingURL=index.js.map
