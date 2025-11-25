/// <reference types="node" />
/// <reference types="node" />
import fs from 'fs';
import { GetProjectSettings, UpdateProjectSettings } from '../../../shared/contracts/admin';
interface UploadFile {
    name: string;
    path: string;
    type: string;
    size: number;
    stream: fs.ReadStream;
    tmpPath: string;
    hash: string;
    url: string;
    width: number;
    height: number;
    ext: string;
    provider: unknown;
}
type FormattedFiles = Partial<Record<keyof UpdateProjectSettings.Request['files'], Partial<UploadFile>>>;
declare const parseFilesData: (files: UpdateProjectSettings.Request['files']) => Promise<Partial<Record<"menuLogo" | "authLogo", Partial<UploadFile>>>>;
declare const getProjectSettings: () => Promise<GetProjectSettings.Response>;
declare const deleteOldFiles: ({ previousSettings, newSettings }: any) => Promise<void[]>;
type LogoFiles = {
    [K in keyof FormattedFiles]: FormattedFiles[K] | null;
};
declare const updateProjectSettings: (newSettings: Omit<UpdateProjectSettings.Request['body'], 'menuLogo' | 'authLogo'> & LogoFiles) => Promise<GetProjectSettings.Response>;
export { deleteOldFiles, parseFilesData, getProjectSettings, updateProjectSettings };
//# sourceMappingURL=project-settings.d.ts.map