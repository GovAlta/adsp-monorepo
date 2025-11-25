import { jsx } from 'react/jsx-runtime';
import 'react';
import '@strapi/admin/strapi-admin';
import '@strapi/design-system';
import 'react-intl';
import 'react-router-dom';
import '../../../utils/colors.mjs';
import '../../../services/settings.mjs';
import { StageColumn, AssigneeColumn } from './components/TableColumns.mjs';
import { STAGE_ATTRIBUTE_NAME, ASSIGNEE_ATTRIBUTE_NAME } from './id/components/constants.mjs';

const REVIEW_WORKFLOW_COLUMNS = [
    {
        name: STAGE_ATTRIBUTE_NAME,
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
        cellFormatter: (props)=>/*#__PURE__*/ jsx(StageColumn, {
                ...props
            })
    },
    {
        name: ASSIGNEE_ATTRIBUTE_NAME,
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
        cellFormatter: (props)=>/*#__PURE__*/ jsx(AssigneeColumn, {
                ...props
            })
    }
];

export { REVIEW_WORKFLOW_COLUMNS };
//# sourceMappingURL=constants.mjs.map
