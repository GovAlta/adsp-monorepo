const info = {
    pluginName: 'content-manager',
    type: 'admin'
};
const homepageRouter = {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            info,
            path: '/homepage/upcoming-releases',
            handler: 'homepage.getUpcomingReleases',
            config: {
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        }
    ]
};

export { homepageRouter as default };
//# sourceMappingURL=homepage.mjs.map
