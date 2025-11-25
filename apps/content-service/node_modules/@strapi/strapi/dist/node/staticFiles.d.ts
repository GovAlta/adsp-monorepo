import type { BuildContext } from './create-build-context';
interface GetDocumentHTMLArgs extends Pick<BuildContext, 'logger'> {
    props?: {
        entryPath?: string;
    };
}
/**
 * TODO: Here in the future we could add the ability
 * to load a user's Document component?
 */
declare const getDocumentHTML: ({ logger, props }: GetDocumentHTMLArgs) => string;
declare const writeStaticClientFiles: (ctx: BuildContext) => Promise<void>;
export { writeStaticClientFiles, getDocumentHTML };
//# sourceMappingURL=staticFiles.d.ts.map