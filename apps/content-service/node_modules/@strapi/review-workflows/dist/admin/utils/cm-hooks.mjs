import { REVIEW_WORKFLOW_COLUMNS } from '../routes/content-manager/model/constants.mjs';

const addColumnToTableHook = ({ displayedHeaders, layout })=>{
    const { options } = layout;
    if (!options.reviewWorkflows) {
        return {
            displayedHeaders,
            layout
        };
    }
    return {
        displayedHeaders: [
            ...displayedHeaders,
            ...REVIEW_WORKFLOW_COLUMNS
        ],
        layout
    };
};

export { addColumnToTableHook };
//# sourceMappingURL=cm-hooks.mjs.map
