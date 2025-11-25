"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubWikiTheme = void 0;
const fs = __importStar(require("fs"));
const typedoc_1 = require("typedoc");
const typedoc_plugin_markdown_1 = require("typedoc-plugin-markdown");
class GithubWikiTheme extends typedoc_plugin_markdown_1.MarkdownTheme {
    constructor(renderer) {
        super(renderer);
        this.entryDocument = 'Home.md';
        this.hideBreadcrumbs = true;
        this.listenTo(this.owner, {
            [typedoc_1.RendererEvent.END]: this.writeSidebar,
        });
    }
    getRelativeUrl(url) {
        return encodeURI('../wiki/' + url.replace('.md', ''));
    }
    toUrl(mapping, reflection) {
        return `${reflection.getFullName().replace(/\//g, '.')}.md`;
    }
    writeSidebar(renderer) {
        var _a;
        const parseUrl = (url) => '../wiki/' + url.replace('.md', '');
        const navigation = this.getNavigation(renderer.project);
        const navJson = [`## ${renderer.project.name}\n`];
        const allowedSections = ['Home', 'Modules', 'Namespaces'];
        (_a = navigation.children) === null || _a === void 0 ? void 0 : _a.filter((navItem) => !navItem.isLabel || allowedSections.includes(navItem.title)).forEach((navItem) => {
            var _a;
            if (navItem.isLabel) {
                navJson.push(`\n### ${navItem.title}\n`);
                (_a = navItem.children) === null || _a === void 0 ? void 0 : _a.forEach((navItemChild) => {
                    const longTitle = navItemChild.title.split('.');
                    const shortTitle = longTitle[longTitle.length - 1];
                    navJson.push(`- [${shortTitle}](${parseUrl(encodeURI(navItemChild.url))})`);
                });
            }
            else {
                const title = navItem.url === this.entryDocument ? 'Home' : navItem.title;
                navJson.push(`- [${title}](${parseUrl(navItem.url)})`);
            }
        });
        fs.writeFileSync(renderer.outputDirectory + '/_Sidebar.md', navJson.join('\n') + '\n');
    }
    get globalsFile() {
        return this.entryPoints.length > 1 ? 'Modules.md' : 'Exports.md';
    }
}
exports.GithubWikiTheme = GithubWikiTheme;
