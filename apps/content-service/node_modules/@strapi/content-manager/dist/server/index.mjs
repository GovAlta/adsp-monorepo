import register from './register.mjs';
import bootstrap from './bootstrap.mjs';
import destroy from './destroy.mjs';
import routes from './routes/index.mjs';
import policies from './policies/index.mjs';
import controllers from './controllers/index.mjs';
import services from './services/index.mjs';

var index = (()=>{
    return {
        register,
        bootstrap,
        destroy,
        controllers,
        routes,
        policies,
        services
    };
});

export { index as default };
//# sourceMappingURL=index.mjs.map
