'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../constants.js');
require('../../../utils/urlYupSchema.js');

const EditFolderModalHeader = ({ isEditing = false })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
            children: formatMessage(isEditing ? {
                id: getTrad.getTrad('modal.folder.edit.title'),
                defaultMessage: 'Edit folder'
            } : {
                id: getTrad.getTrad('modal.folder.create.title'),
                defaultMessage: 'Add new folder'
            })
        })
    });
};

exports.EditFolderModalHeader = EditFolderModalHeader;
//# sourceMappingURL=ModalHeader.js.map
