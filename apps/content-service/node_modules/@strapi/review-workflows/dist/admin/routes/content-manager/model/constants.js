'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
require('@strapi/admin/strapi-admin');
require('@strapi/design-system');
require('react-intl');
require('react-router-dom');
require('../../../utils/colors.js');
require('../../../services/settings.js');
var TableColumns = require('./components/TableColumns.js');
var constants = require('./id/components/constants.js');

const REVIEW_WORKFLOW_COLUMNS = [
    {
        name: constants.STAGE_ATTRIBUTE_NAME,
        attribute: {
            type: 'relation',
            relation: 'oneToMany',
            target: 'admin::review-workflow-stage'
        },
        label: {
            id: 'review-workflows.containers.list.table-headers.reviewWorkflows.stage',
            defaultMessage: 'Review stage'
        },
        searchable: false,
        sortable: true,
        mainField: {
            name: 'name',
            type: 'string'
        },
        cellFormatter: (props)=>/*#__PURE__*/ jsxRuntime.jsx(TableColumns.StageColumn, {
                ...props
            })
    },
    {
        name: constants.ASSIGNEE_ATTRIBUTE_NAME,
        attribute: {
            type: 'relation',
            target: 'admin::user',
            relation: 'oneToMany'
        },
        label: {
            id: 'review-workflows.containers.list.table-headers.reviewWorkflows.assignee',
            defaultMessage: 'Assignee'
        },
        searchable: false,
        sortable: true,
        mainField: {
            name: 'firstname',
            type: 'string'
        },
        cellFormatter: (props)=>/*#__PURE__*/ jsxRuntime.jsx(TableColumns.AssigneeColumn, {
                ...props
            })
    }
];

exports.REVIEW_WORKFLOW_COLUMNS = REVIEW_WORKFLOW_COLUMNS;
//# sourceMappingURL=constants.js.map
