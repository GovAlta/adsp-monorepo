import http from 'http';

const createHTTPServer = (strapi, koaApp)=>{
    const connections = new Set();
    // lazy creation of the request listener
    let handler;
    const listener = function handleRequest(req, res) {
        if (!handler) {
            handler = koaApp.callback();
        }
        return handler(req, res);
    };
    const options = strapi.config.get('server.http.serverOptions', {});
    const server = http.createServer(options, listener);
    server.on('connection', (connection)=>{
        connections.add(connection);
        connection.on('close', ()=>{
            connections.delete(connection);
        });
    });
    // handle port in use cleanly
    server.on('error', (err)=>{
        if ('code' in err && 'port' in err && err.code === 'EADDRINUSE') {
            return strapi.stopWithError(`The port ${err.port} is already used by another application.`);
        }
        strapi.log.error(err);
    });
    const destroy = async ()=>{
        for (const connection of connections){
            connection.destroy();
            connections.delete(connection);
        }
        if (!server.listening) {
            return;
        }
        return new Promise((resolve, reject)=>{
            server.close((error)=>{
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    };
    return Object.assign(server, {
        destroy
    });
};

export { createHTTPServer };
//# sourceMappingURL=http-server.mjs.map
