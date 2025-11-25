import '@strapi/types';
import { DocumentManagerService } from 'src/services/document-manager';
import DocumentMetadata from 'src/services/document-metadata';
type Services = {
    'document-manager': DocumentManagerService;
    'document-metadata': typeof DocumentMetadata;
    [key: string]: any;
};
declare const getService: <TName extends keyof Services>(name: TName) => ReturnType<Services[TName]>;
export { getService };
//# sourceMappingURL=index.d.ts.map