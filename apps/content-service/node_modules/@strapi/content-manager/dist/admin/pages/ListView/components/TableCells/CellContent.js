'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var isEmpty = require('lodash/isEmpty');
var CellValue = require('./CellValue.js');
var Components = require('./Components.js');
var Media = require('./Media.js');
var Relations = require('./Relations.js');

const CellContent = ({ content, mainField, attribute, rowId, name })=>{
    if (!hasContent(content, mainField, attribute)) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
            textColor: "neutral800",
            paddingLeft: attribute.type === ('relation') ? '1.6rem' : 0,
            paddingRight: attribute.type === ('relation') ? '1.6rem' : 0,
            children: "-"
        });
    }
    switch(attribute.type){
        case 'media':
            if (!attribute.multiple) {
                return /*#__PURE__*/ jsxRuntime.jsx(Media.MediaSingle, {
                    ...content
                });
            }
            return /*#__PURE__*/ jsxRuntime.jsx(Media.MediaMultiple, {
                content: content
            });
        case 'relation':
            {
                if (isSingleRelation(attribute.relation)) {
                    return /*#__PURE__*/ jsxRuntime.jsx(Relations.RelationSingle, {
                        mainField: mainField,
                        content: content
                    });
                }
                return /*#__PURE__*/ jsxRuntime.jsx(Relations.RelationMultiple, {
                    rowId: rowId,
                    mainField: mainField,
                    content: content,
                    name: name
                });
            }
        case 'component':
            if (attribute.repeatable) {
                return /*#__PURE__*/ jsxRuntime.jsx(Components.RepeatableComponent, {
                    mainField: mainField,
                    content: content
                });
            }
            return /*#__PURE__*/ jsxRuntime.jsx(Components.SingleComponent, {
                mainField: mainField,
                content: content
            });
        case 'string':
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                description: content,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    maxWidth: "30rem",
                    ellipsis: true,
                    textColor: "neutral800",
                    children: /*#__PURE__*/ jsxRuntime.jsx(CellValue.CellValue, {
                        type: attribute.type,
                        value: content
                    })
                })
            });
        default:
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                maxWidth: "30rem",
                ellipsis: true,
                textColor: "neutral800",
                children: /*#__PURE__*/ jsxRuntime.jsx(CellValue.CellValue, {
                    type: attribute.type,
                    value: content
                })
            });
    }
};
const hasContent = (content, mainField, attribute)=>{
    if (attribute.type === 'component') {
        // Repeatable fields show the ID as fallback, in case the mainField
        // doesn't have any content
        if (attribute.repeatable || !mainField) {
            return content?.length > 0;
        }
        const value = content?.[mainField.name];
        // relations, media ... show the id as fallback
        if (mainField.name === 'id' && ![
            undefined,
            null
        ].includes(value)) {
            return true;
        }
        return !isEmpty(value);
    }
    if (attribute.type === 'relation') {
        if (isSingleRelation(attribute.relation)) {
            return !isEmpty(content);
        }
        if (Array.isArray(content)) {
            return content.length > 0;
        }
        return content?.count > 0;
    }
    /*
      Biginteger fields need to be treated as strings, as `isNumber`
      doesn't deal with them.
  */ if ([
        'integer',
        'decimal',
        'float',
        'number'
    ].includes(attribute.type)) {
        return typeof content === 'number';
    }
    if (attribute.type === 'boolean') {
        return content !== null;
    }
    return !isEmpty(content);
};
const isSingleRelation = (type)=>[
        'oneToOne',
        'manyToOne',
        'oneToOneMorph'
    ].includes(type);

exports.CellContent = CellContent;
//# sourceMappingURL=CellContent.js.map
