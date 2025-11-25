import { PreviewSidePanel } from './components/PreviewSidePanel.mjs';

const previewAdmin = {
    bootstrap (app) {
        const contentManagerPluginApis = app.getPlugin('content-manager').apis;
        contentManagerPluginApis.addEditViewSidePanel([
            PreviewSidePanel
        ]);
    }
};

export { previewAdmin };
//# sourceMappingURL=index.mjs.map
