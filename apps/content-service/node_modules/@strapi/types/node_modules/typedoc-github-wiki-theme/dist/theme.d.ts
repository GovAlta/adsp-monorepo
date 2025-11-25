import { DeclarationReflection, Renderer } from 'typedoc';
import { MarkdownTheme } from 'typedoc-plugin-markdown';
export declare class GithubWikiTheme extends MarkdownTheme {
    constructor(renderer: Renderer);
    getRelativeUrl(url: string): string;
    toUrl(mapping: any, reflection: DeclarationReflection): string;
    writeSidebar(renderer: any): void;
    get globalsFile(): "Modules.md" | "Exports.md";
}
