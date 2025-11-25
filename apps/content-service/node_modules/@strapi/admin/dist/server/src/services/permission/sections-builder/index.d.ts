declare const createDefaultSectionBuilder: () => {
    createSection(sectionName: string, options: import("./section").SectionOptions): any;
    deleteSection(sectionName: string): any;
    addHandler(sectionName: string, handler: () => unknown): any;
    addMatcher(sectionName: string, matcher: () => unknown): any;
    build(actions?: import("../../../domain/action").Action[]): Promise<any>;
};
export default createDefaultSectionBuilder;
//# sourceMappingURL=index.d.ts.map