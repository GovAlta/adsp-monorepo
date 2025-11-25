import adminFile from './admin-file.mjs';
import adminFolder from './admin-folder.mjs';
import adminFolderFile from './admin-folder-file.mjs';
import adminSettings from './admin-settings.mjs';
import adminUpload from './admin-upload.mjs';
import contentApi from './content-api.mjs';
import viewConfiguration from './view-configuration.mjs';

const controllers = {
    'admin-file': adminFile,
    'admin-folder': adminFolder,
    'admin-folder-file': adminFolderFile,
    'admin-settings': adminSettings,
    'admin-upload': adminUpload,
    'content-api': contentApi,
    'view-configuration': viewConfiguration
};

export { controllers };
//# sourceMappingURL=index.mjs.map
