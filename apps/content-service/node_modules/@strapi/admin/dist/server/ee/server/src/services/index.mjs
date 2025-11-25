import auth from './auth.mjs';
import passport from './passport.mjs';
import role from './role.mjs';
import user from './user.mjs';
import metrics from './metrics.mjs';
import seatEnforcement from './seat-enforcement.mjs';
import persistTables from './persist-tables.mjs';

var services = {
    auth,
    passport,
    role,
    user,
    metrics,
    'seat-enforcement': seatEnforcement,
    'persist-tables': persistTables
};

export { services as default };
//# sourceMappingURL=index.mjs.map
