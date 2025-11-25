import { ForgotPassword } from './components/ForgotPassword.mjs';
import { ForgotPasswordSuccess } from './components/ForgotPasswordSuccess.mjs';
import { Oops } from './components/Oops.mjs';
import { Register } from './components/Register.mjs';
import { ResetPassword } from './components/ResetPassword.mjs';

const FORMS = {
    'forgot-password': ForgotPassword,
    'forgot-password-success': ForgotPasswordSuccess,
    // the `Component` attribute is set after all forms and CE/EE components are loaded, but since we
    // are here outside of a React component we can not use the hook directly
    login: ()=>null,
    oops: Oops,
    register: Register,
    'register-admin': Register,
    'reset-password': ResetPassword,
    providers: ()=>null
};

export { FORMS };
//# sourceMappingURL=constants.mjs.map
