import { jsx } from 'react/jsx-runtime';
import { useForm, Blocker as Blocker$1 } from '@strapi/admin/strapi-admin';

// Needs to be wrapped in a component to have access to the form context via a hook.
/**
 * Prevents users from leaving the page with unsaved form changes
 */ const Blocker = ()=>{
    const resetForm = useForm('Blocker', (state)=>state.resetForm);
    // We reset the form to the published version to avoid errors like – https://strapi-inc.atlassian.net/browse/CONTENT-2284
    return /*#__PURE__*/ jsx(Blocker$1, {
        onProceed: resetForm
    });
};

export { Blocker };
//# sourceMappingURL=Blocker.mjs.map
