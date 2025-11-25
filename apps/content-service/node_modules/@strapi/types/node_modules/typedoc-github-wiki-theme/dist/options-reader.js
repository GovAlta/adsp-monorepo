"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubWikiThemeOptionsReader = void 0;
class GithubWikiThemeOptionsReader {
    constructor() {
        this.name = 'github-wiki-theme-reader';
        this.order = 900;
        this.supportsPackages = false;
    }
    read(container) {
        if (container.getValue('theme') === 'default') {
            container.setValue('theme', 'github-wiki');
        }
    }
}
exports.GithubWikiThemeOptionsReader = GithubWikiThemeOptionsReader;
